import { computed, ref, watch, onScopeDispose, type ComputedRef, type Ref } from 'vue'

interface TypewriterOptions {
  enabled: () => boolean
  charsPerSecond: () => number
}

export interface Typewriter {
  /** The slice of `source` revealed so far. */
  text: ComputedRef<string>
  isTyping: Ref<boolean>
  /** Reveal everything immediately. */
  skip: () => void
  /** Rewind and type the current source out again, ignoring the enabled check. */
  restart: () => void
}

export function useTypewriter(source: Ref<string>, options: TypewriterOptions): Typewriter {
  const revealed = ref(0)
  const isTyping = ref(false)
  let frame = 0

  const stop = (): void => {
    cancelAnimationFrame(frame)
    frame = 0
    isTyping.value = false
  }

  const finish = (): void => {
    stop()
    revealed.value = source.value.length
  }

  const run = (force = false): void => {
    stop()
    if ((!force && !options.enabled()) || !source.value.length) {
      revealed.value = source.value.length
      return
    }

    revealed.value = 0
    isTyping.value = true
    const startedAt = performance.now()

    const step = (now: number): void => {
      const rate = Math.max(1, options.charsPerSecond())
      const target = Math.floor(((now - startedAt) / 1000) * rate)
      revealed.value = Math.min(target, source.value.length)
      if (revealed.value >= source.value.length) {
        stop()
        return
      }
      frame = requestAnimationFrame(step)
    }

    frame = requestAnimationFrame(step)
  }

  // A minimised window gets no frames at all; reveal everything rather than
  // leave the preview empty until it comes back.
  const onVisibility = (): void => {
    if (document.hidden && isTyping.value) finish()
  }
  document.addEventListener('visibilitychange', onVisibility)

  watch(source, () => run(), { immediate: true })
  onScopeDispose(() => {
    document.removeEventListener('visibilitychange', onVisibility)
    stop()
  })

  return {
    text: computed(() => (isTyping.value ? source.value.slice(0, revealed.value) : source.value)),
    isTyping,
    skip: finish,
    restart: () => run(true)
  }
}
