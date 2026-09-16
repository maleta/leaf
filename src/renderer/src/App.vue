<script setup lang="ts">
import { computed, nextTick, onMounted, onBeforeUnmount, ref, watch, watchEffect } from 'vue'
import TitleBar from './components/TitleBar.vue'
import PreviewPane from './components/PreviewPane.vue'
import EditorPane from './components/EditorPane.vue'
import SettingsPanel from './components/SettingsPanel.vue'
import FileTree from './components/FileTree.vue'
import EmptyState from './components/EmptyState.vue'
import { useDocument } from './composables/useDocument'
import { useSettings, type ViewMode } from './composables/useSettings'
import { useTypewriter } from './composables/useTypewriter'
import { useSyncScroll } from './composables/useSyncScroll'
import { useScrollMemory } from './composables/useScrollMemory'
import type { Document, MenuCommand } from '../../shared/types'

const settings = useSettings()
const { path, name, draft, isDirty, conflict, adopt, applyExternal, resolveConflict, save, saveAs, reload } =
  useDocument()

const view = ref<ViewMode>(settings.defaultView)
const settingsOpen = ref(false)
const treeOpen = ref(false)
const dragging = ref(false)

/** Only reset when a document arrives, so editing never restarts the animation. */
const typewriterSource = ref('')
const typewriter = useTypewriter(typewriterSource, {
  enabled: () => settings.renderMode === 'typing' && view.value === 'preview',
  charsPerSecond: () => settings.charsPerSecond
})

const isTyping = typewriter.isTyping
const previewContent = computed(() => (isTyping.value ? typewriter.text.value : draft.value))

const systemDark = ref(false)
const isDark = computed(() =>
  settings.theme === 'system' ? systemDark.value : settings.theme === 'dark'
)

const previewPane = ref<HTMLElement | null>(null)
const editorPane = ref<HTMLElement | null>(null)
const scroll = useScrollMemory({ preview: previewPane, editor: editorPane })

// Syncing while a position is being restored would just fight the restore.
const sync = useSyncScroll(
  () => settings.syncScroll && view.value === 'split' && !scroll.isRestoring()
)
const registerEditor = sync.register('left')
const registerPreview = sync.register('right')

function onEditorReady(element: HTMLElement): void {
  editorPane.value = element
  registerEditor(element)
}

function onPreviewReady(element: HTMLElement): void {
  previewPane.value = element
  registerPreview(element)
}

const documentFolder = computed(() =>
  path.value ? path.value.slice(0, path.value.lastIndexOf('/')) : null
)

/** Replacing the document in place would drop unsaved edits, so ask first. */
async function openFromTree(filePath: string): Promise<void> {
  if (filePath === path.value) return
  if (isDirty.value && !(await window.mdPreview.confirmDiscard(name.value))) return
  await window.mdPreview.openPath(filePath)
}

const openDialog = (): void => void window.mdPreview.openDialog()
const reveal = (): void => void window.mdPreview.reveal()

function receive(document: Document): void {
  const isFirstDocument = path.value === null
  scroll.remember(path.value)
  adopt(document)
  // Only a window's first document adopts the default layout; picking another
  // file afterwards keeps whatever the user is working in.
  if (isFirstDocument) view.value = settings.defaultView
  typewriterSource.value = document.content
  // A typewriter run has to start from the top to be worth watching.
  const willType = settings.renderMode === 'typing' && view.value === 'preview'
  void nextTick(() => scroll.restore(document.path, willType))
}

function toggleView(): void {
  const current = path.value
  // Reflowing into a narrower pane moves the text, so re-anchor afterwards.
  scroll.remember(current)
  view.value = view.value === 'split' ? 'preview' : 'split'
  if (view.value === 'split') typewriter.skip()
  else {
    editorPane.value = null
    registerEditor(null)
  }
  if (current) void nextTick(() => scroll.restore(current))
}

function replay(): void {
  view.value = 'preview'
  typewriterSource.value = draft.value
  typewriter.restart()
}

function adjustFont(delta: number): void {
  settings.fontScale = Math.min(1.6, Math.max(0.8, Number((settings.fontScale + delta).toFixed(2))))
}

const COMMANDS: Record<MenuCommand, () => void> = {
  open: openDialog,
  save: () => void save(),
  'save-as': () => void saveAs(),
  'toggle-split': toggleView,
  'toggle-settings': () => (settingsOpen.value = !settingsOpen.value),
  'toggle-tree': () => (treeOpen.value = !treeOpen.value),
  'reload-file': () => void reload(),
  'zoom-in': () => adjustFont(0.05),
  'zoom-out': () => adjustFont(-0.05),
  'zoom-reset': () => (settings.fontScale = 1)
}

function onDrop(event: DragEvent): void {
  dragging.value = false
  const file = event.dataTransfer?.files?.[0]
  if (!file) return
  const filePath = window.mdPreview.pathForFile(file)
  if (filePath) void window.mdPreview.openPath(filePath)
}

/** Links inside rendered markdown belong in the user's browser, not this window. */
function onClick(event: MouseEvent): void {
  const href = (event.target as HTMLElement | null)?.closest('a')?.getAttribute('href')
  if (!href || !/^https?:/i.test(href)) return
  event.preventDefault()
  void window.mdPreview.openExternal(href)
}

// Typing out a document the user has started editing is only in the way.
watch(draft, () => isTyping.value && typewriter.skip())

watchEffect(() => {
  document.documentElement.dataset.theme = isDark.value ? 'dark' : 'light'
})

let disposers: Array<() => void> = []

onMounted(() => {
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  systemDark.value = media.matches
  const onScheme = (event: MediaQueryListEvent): boolean => (systemDark.value = event.matches)
  media.addEventListener('change', onScheme)

  // The window may already hold a file (a reload, or the renderer restarting).
  void window.mdPreview.reload().then((document) => document && receive(document))

  disposers = [
    window.mdPreview.onOpened(receive),
    window.mdPreview.onExternalChange(applyExternal),
    window.mdPreview.onMenuCommand((command) => COMMANDS[command]?.()),
    () => media.removeEventListener('change', onScheme)
  ]
})

onBeforeUnmount(() => disposers.forEach((dispose) => dispose()))
</script>

<template>
  <div
    class="app"
    :class="{ dragging }"
    @click="onClick"
    @dragover.prevent="dragging = true"
    @dragleave="dragging = false"
    @drop.prevent="onDrop"
  >
    <TitleBar
      :name="name"
      :is-dirty="isDirty"
      :has-file="path !== null"
      :view="view"
      :typing="isTyping"
      :can-replay="settings.renderMode === 'typing'"
      :settings-open="settingsOpen"
      :tree-open="treeOpen"
      @open="openDialog"
      @toggle-tree="treeOpen = !treeOpen"
      @reveal="reveal"
      @toggle-view="toggleView"
      @toggle-settings="settingsOpen = !settingsOpen"
      @replay="replay"
    />

    <div v-if="conflict" class="banner">
      <span>{{ name }} changed on disk while you had unsaved edits.</span>
      <button @click="resolveConflict('disk')">Use disk version</button>
      <button @click="resolveConflict('mine')">Keep mine</button>
    </div>

    <main class="body">
      <FileTree
        v-if="treeOpen"
        :dir="documentFolder"
        :active-path="path"
        @open="openFromTree"
      />

      <div v-if="path !== null" class="panes" :data-view="view">
        <EditorPane
          v-if="view === 'split'"
          v-model="draft"
          class="pane editor-pane"
          :is-dark="isDark"
          :font-scale="settings.fontScale"
          @ready="onEditorReady"
        />
        <PreviewPane
          class="pane"
          :content="previewContent"
          :is-dark="isDark"
          :streaming="isTyping"
          :settings="settings"
          @ready="onPreviewReady"
        />
      </div>
      <EmptyState v-else @open="openDialog" />

      <SettingsPanel v-if="settingsOpen" :settings="settings" @close="settingsOpen = false" />
    </main>
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
}

.app.dragging::after {
  content: '';
  position: absolute;
  inset: var(--titlebar-height) 6px 6px;
  border: 2px dashed var(--accent);
  border-radius: 8px;
  pointer-events: none;
}

.body {
  display: flex;
  flex: 1;
  min-height: 0;
}

.panes {
  display: flex;
  flex: 1;
  min-width: 0;
}

.panes[data-view='split'] .pane {
  width: 50%;
  min-width: 0;
}

.panes[data-view='preview'] .pane {
  flex: 1;
  min-width: 0;
}

.editor-pane {
  border-right: 1px solid var(--chrome-border);
}

.banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 14px;
  background: #f7c948;
  color: #3a2c00;
  font-size: 12px;
}

.banner button {
  padding: 3px 10px;
  border: 0;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.14);
  font-size: 11.5px;
  cursor: default;
}
</style>
