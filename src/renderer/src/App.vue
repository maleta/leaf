<script setup lang="ts">
import { computed, nextTick, onMounted, onBeforeUnmount, ref, watch, watchEffect } from 'vue'
import TitleBar from './components/TitleBar.vue'
import PreviewPane from './components/PreviewPane.vue'
import EditorPane from './components/EditorPane.vue'
import SettingsPanel from './components/SettingsPanel.vue'
import FileTree from './components/FileTree.vue'
import TabBar from './components/TabBar.vue'
import EmptyState from './components/EmptyState.vue'
import { useDocument } from './composables/useDocument'
import { useSettings, type ViewMode } from './composables/useSettings'
import { useTypewriter } from './composables/useTypewriter'
import { useSyncScroll } from './composables/useSyncScroll'
import { useScrollMemory } from './composables/useScrollMemory'
import { isOpenable, textLanguage, type Document, type MenuCommand } from '../../shared/types'

const settings = useSettings()
const {
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
} = useDocument()

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
const language = computed(() => textLanguage(name.value))

/** A fence longer than any the text itself starts a line with, so nothing inside can close it. */
function fence(text: string, lang: string): string {
  const longest = (text.match(/^ {0,3}`{3,}/gm) ?? []).reduce(
    (max, run) => Math.max(max, run.trim().length),
    2
  )
  const marker = '`'.repeat(longest + 1)
  return `${marker}${lang}\n${text}\n${marker}`
}

const previewContent = computed(() => {
  const text = isTyping.value ? typewriter.text.value : draft.value
  return language.value ? fence(text, language.value) : text
})

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

/** The tree swaps the active tab's file; replacing it would drop unsaved edits, so ask first. */
async function openFromTree(filePath: string): Promise<void> {
  if (filePath === path.value) return
  if (hasTab(filePath)) return showTab(filePath)
  if (isDirty.value && !(await window.mdPreview.confirmDiscard(name.value))) return
  receive(await window.mdPreview.read(filePath), 'replace')
}

const openDialog = (): void => void window.mdPreview.openDialog()
const reveal = (): void => void (path.value && window.mdPreview.reveal(path.value))

function receive(document: Document, placement: 'tab' | 'replace' = 'tab'): void {
  if (hasTab(document.path)) return showTab(document.path)
  const isFirstDocument = path.value === null
  scroll.remember(path.value)
  open(document, placement)
  // Only a window's first document adopts the default layout; picking another
  // file afterwards keeps whatever the user is working in.
  if (isFirstDocument) view.value = settings.defaultView
  typewriterSource.value = document.content
  // A typewriter run has to start from the top to be worth watching.
  const willType = settings.renderMode === 'typing' && view.value === 'preview'
  void nextTick(() => scroll.restore(document.path, willType))
}

/** Switching back to a tab shows it as it was left, so no typing it out again. */
function showTab(filePath: string): void {
  if (filePath === path.value) return
  scroll.remember(path.value)
  typewriter.skip()
  activate(filePath)
  void nextTick(() => scroll.restore(filePath))
}

async function closeTab(filePath: string): Promise<void> {
  const tab = tabs.value.find((candidate) => candidate.path === filePath)
  if (!tab) return
  if (isTabDirty(tab) && !(await window.mdPreview.confirmDiscard(tab.name))) return
  scroll.remember(path.value)
  const wasActive = filePath === path.value
  if (wasActive) typewriter.skip()
  close(filePath)
  const next = path.value
  if (wasActive && next) void nextTick(() => scroll.restore(next))
}

function cycleTab(step: number): void {
  const count = tabs.value.length
  if (count < 2) return
  const index = tabs.value.findIndex((tab) => tab.path === path.value)
  showTab(tabs.value[(index + step + count) % count].path)
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
  'close-tab': () => (path.value ? void closeTab(path.value) : window.close()),
  'next-tab': () => cycleTab(1),
  'previous-tab': () => cycleTab(-1),
  'reload-file': () => void reload(),
  'zoom-in': () => adjustFont(0.05),
  'zoom-out': () => adjustFont(-0.05),
  'zoom-reset': () => (settings.fontScale = 1)
}

function onDrop(event: DragEvent): void {
  dragging.value = false
  for (const file of event.dataTransfer?.files ?? []) {
    const filePath = window.mdPreview.pathForFile(file)
    if (filePath && isOpenable(filePath)) void window.mdPreview.read(filePath).then((doc) => receive(doc))
  }
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

  // The window may already hold files (a reload, or the renderer restarting).
  void window.mdPreview.restore().then(({ documents, active }) => {
    documents.forEach((document) => receive(document))
    if (active) showTab(active)
  })

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

    <TabBar
      v-if="tabs.length > 1"
      :tabs="tabs"
      :active-path="path"
      :is-dirty="isTabDirty"
      @activate="showTab"
      @close="closeTab"
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
          :file-name="name"
          :is-dark="isDark"
          :font-scale="settings.fontScale"
          @ready="onEditorReady"
        />
        <PreviewPane
          class="pane"
          :content="previewContent"
          :source="draft"
          :language="language"
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
