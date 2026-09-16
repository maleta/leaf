import { onScopeDispose, type Ref } from 'vue'

/**
 * Keeps two panes at the same scroll ratio. The pane being scrolled drives the
 * other, and echo events from the driven pane are ignored.
 */
export function useSyncScroll(enabled: () => boolean): {
  register: (side: 'left' | 'right') => (element: Element | null) => void
} {
  const panes: Record<'left' | 'right', HTMLElement | null> = { left: null, right: null }
  const cleanups = new Map<HTMLElement, () => void>()
  let driver: 'left' | 'right' | null = null
  let releaseTimer: number | undefined

  const ratio = (element: HTMLElement): number => {
    const range = element.scrollHeight - element.clientHeight
    return range > 0 ? element.scrollTop / range : 0
  }

  const onScroll = (side: 'left' | 'right') => (): void => {
    if (!enabled()) return
    if (driver && driver !== side) return

    const from = panes[side]
    const to = panes[side === 'left' ? 'right' : 'left']
    if (!from || !to) return

    driver = side
    to.scrollTop = ratio(from) * (to.scrollHeight - to.clientHeight)

    clearTimeout(releaseTimer)
    releaseTimer = window.setTimeout(() => (driver = null), 120)
  }

  const register = (side: 'left' | 'right') => (element: Element | null): void => {
    const previous = panes[side]
    if (previous) {
      cleanups.get(previous)?.()
      cleanups.delete(previous)
    }

    const node = element as HTMLElement | null
    panes[side] = node
    if (!node) return

    const handler = onScroll(side)
    node.addEventListener('scroll', handler, { passive: true })
    cleanups.set(node, () => node.removeEventListener('scroll', handler))
  }

  onScopeDispose(() => {
    clearTimeout(releaseTimer)
    cleanups.forEach((cleanup) => cleanup())
    cleanups.clear()
  })

  return { register }
}
