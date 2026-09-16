import { computed, ref, watch, type ComputedRef, type Ref } from 'vue'
import type { Document } from '../../../shared/types'

export interface DocumentStore {
  path: Ref<string | null>
  name: Ref<string>
  /** The live buffer: what the editor holds and the preview renders. */
  draft: Ref<string>
  isDirty: ComputedRef<boolean>
  /** Set when the file changed on disk while the buffer had unsaved edits. */
  conflict: Ref<Document | null>
  adopt: (document: Document) => void
  applyExternal: (document: Document) => void
  resolveConflict: (keep: 'disk' | 'mine') => void
  save: () => Promise<void>
  saveAs: () => Promise<void>
  reload: () => Promise<void>
}

export function useDocument(): DocumentStore {
  const path = ref<string | null>(null)
  const name = ref('Untitled')
  const onDisk = ref('')
  const draft = ref('')
  const conflict = ref<Document | null>(null)

  const isDirty = computed(() => path.value !== null && draft.value !== onDisk.value)

  watch(isDirty, (dirty) => void window.mdPreview.setEdited(dirty))

  const adopt = (document: Document): void => {
    path.value = document.path
    name.value = document.name
    onDisk.value = document.content
    draft.value = document.content
    conflict.value = null
  }

  const applyExternal = (document: Document): void => {
    if (document.content === onDisk.value) return
    if (isDirty.value) {
      conflict.value = document
      return
    }
    adopt(document)
  }

  const resolveConflict = (keep: 'disk' | 'mine'): void => {
    const incoming = conflict.value
    if (!incoming) return
    conflict.value = null
    if (keep === 'disk') adopt(incoming)
    else onDisk.value = incoming.content
  }

  const save = async (): Promise<void> => {
    if (!path.value) return saveAs()
    const saved = await window.mdPreview.save(draft.value)
    if (saved) onDisk.value = draft.value
  }

  const saveAs = async (): Promise<void> => {
    const saved = await window.mdPreview.saveAs(draft.value)
    if (!saved) return
    path.value = saved
    name.value = saved.split('/').pop() ?? saved
    onDisk.value = draft.value
  }

  const reload = async (): Promise<void> => {
    const fresh = await window.mdPreview.reload()
    if (fresh) adopt(fresh)
  }

  return { path, name, draft, isDirty, conflict, adopt, applyExternal, resolveConflict, save, saveAs, reload }
}
