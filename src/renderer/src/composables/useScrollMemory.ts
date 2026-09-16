import { onScopeDispose, type Ref } from 'vue'

interface Panes {
  preview: Ref<HTMLElement | null>
  editor: Ref<HTMLElement | null>
}

/** The block at the top of the viewport, and how far above it starts. */
interface Anchor {
  index: number
  offset: number
}

interface Position {
  anchor: Anchor | null
  previewTop: number
  editorTop: number
}

export interface ScrollMemory {
  /** Capture where a document is sitting, before it is swapped out or relaid out. */
  remember: (path: string | null) => void
  /** Put a document back where it was; one never seen before starts at the top. */
  restore: (path: string, toTop?: boolean) => void
  isRestoring: () => boolean
}

const SETTLE_MS = 2000
const CONTENT = '.stream-markdown'

function blocks(scroller: HTMLElement): HTMLElement[] {
  const content = scroller.querySelector<HTMLElement>(CONTENT)
  return content ? (Array.from(content.children) as HTMLElement[]) : []
}

function captureAnchor(scroller: HTMLElement): Anchor | null {
  const top = scroller.getBoundingClientRect().top
  const children = blocks(scroller)
  const index = children.findIndex((child) => child.getBoundingClientRect().bottom > top + 1)
  return index < 0 ? null : { index, offset: children[index].getBoundingClientRect().top - top }
}

/** How far the anchored block currently sits from where it should be, in pixels. */
function anchorDrift(scroller: HTMLElement, anchor: Anchor): number | null {
  const child = blocks(scroller)[anchor.index]
  if (!child) return null
  return child.getBoundingClientRect().top - scroller.getBoundingClientRect().top - anchor.offset
}

export function useScrollMemory(panes: Panes): ScrollMemory {
  const positions = new Map<string, Position>()
  let frame = 0
  let detach: (() => void) | undefined

  const stop = (): void => {
    cancelAnimationFrame(frame)
    frame = 0
    detach?.()
    detach = undefined
  }

  function remember(path: string | null): void {
    if (!path) return
    const preview = panes.preview.value
    const previous = positions.get(path)
    positions.set(path, {
      anchor: (preview && captureAnchor(preview)) || previous?.anchor || null,
      previewTop: preview?.scrollTop ?? previous?.previewTop ?? 0,
      // The editor only exists in split view; keep the last known value otherwise.
      editorTop: panes.editor.value?.scrollTop ?? previous?.editorTop ?? 0
    })
  }

  /** Returns true once both panes sit where they should. */
  function settle(target: Position): boolean {
    let done = true
    const preview = panes.preview.value
    if (preview) {
      const drift = target.anchor ? anchorDrift(preview, target.anchor) : null
      if (drift === null) {
        preview.scrollTop = target.previewTop
        done &&= Math.abs(preview.scrollTop - target.previewTop) <= 1
      } else if (Math.abs(drift) > 1) {
        preview.scrollTop += drift
        done = false
      }
    }
    const editor = panes.editor.value
    if (editor) {
      editor.scrollTop = target.editorTop
      done &&= Math.abs(editor.scrollTop - target.editorTop) <= 1
    }
    return done
  }

  function restore(path: string, toTop = false): void {
    stop()
    const target = toTop ? undefined : positions.get(path)

    if (!target) {
      if (panes.preview.value) panes.preview.value.scrollTop = 0
      if (panes.editor.value) panes.editor.value.scrollTop = 0
      return
    }

    if (settle(target)) return

    // Highlighting, math and diagrams keep growing the document, so the first
    // pass gets clamped to whatever height exists right now. Keep correcting
    // until the anchor lands, and yield the moment the user acts.
    const deadline = performance.now() + SETTLE_MS
    const giveUp = (): void => stop()
    const events = ['wheel', 'pointerdown', 'keydown'] as const
    events.forEach((name) => window.addEventListener(name, giveUp, { passive: true }))
    detach = () => events.forEach((name) => window.removeEventListener(name, giveUp))

    const tick = (): void => {
      if (settle(target) || performance.now() > deadline) {
        stop()
        return
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
  }

  onScopeDispose(stop)

  return { remember, restore, isRestoring: () => frame !== 0 }
}
