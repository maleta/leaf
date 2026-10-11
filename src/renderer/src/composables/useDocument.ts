import { computed, ref, watch, type ComputedRef, type Ref, type WritableComputedRef } from 'vue'
import type { Document } from '../../../shared/types'

export interface Tab {
  path: string
  name: string
  onDisk: string
  /** The live buffer: what the editor holds and the preview renders. */
  draft: string
  /** Set when the file changed on disk while the buffer had unsaved edits. */
  conflict: Document | null
}

export interface DocumentStore {
  tabs: Ref<Tab[]>
  path: ComputedRef<string | null>
  name: ComputedRef<string>
  draft: WritableComputedRef<string>
  isDirty: ComputedRef<boolean>
  conflict: ComputedRef<Document | null>
  hasTab: (path: string) => boolean
  isTabDirty: (tab: Tab) => boolean
  /** Focuses the document's tab if it is open, else adds a tab or replaces the active one. */
  open: (document: Document, placement: 'tab' | 'replace') => void
  activate: (path: string) => void
  close: (path: string) => void
  applyExternal: (document: Document) => void
  resolveConflict: (keep: 'disk' | 'mine') => void
  save: () => Promise<void>
  saveAs: () => Promise<void>
  reload: () => Promise<void>
}

export function useDocument(): DocumentStore {
  const tabs = ref<Tab[]>([])
  const activePath = ref<string | null>(null)

  const active = computed(() => tabs.value.find((tab) => tab.path === activePath.value) ?? null)
  const path = computed(() => active.value?.path ?? null)
  const name = computed(() => active.value?.name ?? 'Untitled')
  const conflict = computed(() => active.value?.conflict ?? null)
  const draft = computed({
    get: () => active.value?.draft ?? '',
    set: (value) => {
      if (active.value) active.value.draft = value
    }
  })

  const isTabDirty = (tab: Tab): boolean => tab.draft !== tab.onDisk
  const isDirty = computed(() => (active.value ? isTabDirty(active.value) : false))
  const anyDirty = computed(() => tabs.value.some(isTabDirty))

  watch(anyDirty, (dirty) => void window.mdPreview.setEdited(dirty))
  watch(
    () => [tabs.value.map((tab) => tab.path), activePath.value] as const,
    ([paths, current]) => void window.mdPreview.syncTabs([...paths], current)
  )

  const find = (path: string): Tab | undefined => tabs.value.find((tab) => tab.path === path)
  const hasTab = (path: string): boolean => find(path) !== undefined

  const fresh = (document: Document): Tab => ({
    path: document.path,
    name: document.name,
    onDisk: document.content,
    draft: document.content,
    conflict: null
  })

  const open = (document: Document, placement: 'tab' | 'replace'): void => {
    if (!hasTab(document.path)) {
      const index = tabs.value.findIndex((tab) => tab.path === activePath.value)
      if (placement === 'replace' && index >= 0) tabs.value.splice(index, 1, fresh(document))
      else tabs.value.splice(index + 1, 0, fresh(document))
    }
    activePath.value = document.path
  }

  const activate = (path: string): void => {
    if (hasTab(path)) activePath.value = path
  }

  /** Closing the active tab moves to its right-hand neighbour, or the left one at the end. */
  const close = (path: string): void => {
    const index = tabs.value.findIndex((tab) => tab.path === path)
    if (index < 0) return
    tabs.value.splice(index, 1)
    if (activePath.value !== path) return
    activePath.value = tabs.value[Math.min(index, tabs.value.length - 1)]?.path ?? null
  }

  const replaceContent = (tab: Tab, document: Document): void => {
    tab.onDisk = document.content
    tab.draft = document.content
    tab.conflict = null
  }

  const applyExternal = (document: Document): void => {
    const tab = find(document.path)
    if (!tab || document.content === tab.onDisk) return
    if (isTabDirty(tab)) {
      tab.conflict = document
      return
    }
    replaceContent(tab, document)
  }

  const resolveConflict = (keep: 'disk' | 'mine'): void => {
    const tab = active.value
    const incoming = tab?.conflict
    if (!tab || !incoming) return
    tab.conflict = null
    if (keep === 'disk') replaceContent(tab, incoming)
    else tab.onDisk = incoming.content
  }

  const save = async (): Promise<void> => {
    const tab = active.value
    if (!tab) return
    const content = tab.draft
    const saved = await window.mdPreview.save(tab.path, content)
    if (saved) tab.onDisk = content
  }

  const saveAs = async (): Promise<void> => {
    const tab = active.value
    if (!tab) return
    const content = tab.draft
    const saved = await window.mdPreview.saveAs(tab.path, content)
    if (!saved) return
    // The file under that name was just overwritten, so a tab still showing it is stale.
    if (saved !== tab.path) tabs.value = tabs.value.filter((other) => other.path !== saved)
    Object.assign(tab, { path: saved, name: saved.split('/').pop() ?? saved, onDisk: content })
    activePath.value = saved
  }

  const reload = async (): Promise<void> => {
    const tab = active.value
    if (tab) replaceContent(tab, await window.mdPreview.read(tab.path))
  }

  return {
    tabs,
    path,
    name,
    draft,
    isDirty,
    conflict,
    hasTab,
    isTabDirty,
    open,
    activate,
    close,
    applyExternal,
    resolveConflict,
    save,
    saveAs,
    reload
  }
}
