<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import AppIcon from './AppIcon.vue'
import type { DirEntry, DirListing } from '../../../shared/types'

const props = defineProps<{ dir: string | null; activePath: string | null }>()
const emit = defineEmits<{ open: [path: string] }>()

const listing = ref<DirListing | null>(null)
const error = ref('')
const cwd = ref<string | null>(null)
const tree = ref<HTMLElement | null>(null)

async function load(target: string | null): Promise<void> {
  const keepFocus = tree.value?.contains(document.activeElement) ?? false
  try {
    listing.value = await window.mdPreview.listDirectory(target ?? undefined)
    cwd.value = listing.value.path
    error.value = ''
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : String(cause)
  }
  // The row that was clicked is gone with the old listing; keyboard use continues on the pane.
  if (keepFocus) {
    await nextTick()
    tree.value?.focus()
  }
}

onMounted(async () => {
  await load(props.dir)
  tree.value?.focus()
})

// Follow the document when it moves to another folder, but stay put while browsing.
watch(() => props.dir, (dir) => {
  if (dir && dir !== cwd.value) void load(dir)
})

const atDocumentFolder = computed(() => !props.dir || cwd.value === props.dir)

function activate(entry: DirEntry): void {
  if (entry.kind === 'directory') void load(entry.path)
  else if (entry.kind === 'markdown') emit('open', entry.path)
}

const TYPE_AHEAD_WINDOW = 1000

let typed = ''
let typedAt = 0

function typeAhead(event: KeyboardEvent): void {
  const key = event.key
  if (key.length !== 1 || key === ' ' || event.metaKey || event.ctrlKey || event.altKey) return

  const now = Date.now()
  typed = now - typedAt < TYPE_AHEAD_WINDOW ? typed + key : key
  typedAt = now

  const entries = listing.value?.entries ?? []
  const rows = [...(tree.value?.querySelectorAll<HTMLButtonElement>('.row[data-kind]') ?? [])]
  // A single letter walks through its matches; anything longer searches the prefix from the top.
  const start = typed.length === 1 ? rows.findIndex((row) => row === document.activeElement) + 1 : 0
  const prefix = typed.toLowerCase()

  for (let step = 0; step < entries.length; step++) {
    const index = (start + step) % entries.length
    const entry = entries[index]
    if (entry.kind !== 'other' && entry.name.toLowerCase().startsWith(prefix)) {
      rows[index]?.focus()
      return
    }
  }
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  if (bytes >= 10 * 1024) return `${Math.round(bytes / 1024)} KB`
  // below a kilobyte, rounding to KB would just read "0.0"
  return bytes >= 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${bytes} B`
}

const folderName = (path: string): string => path.split('/').filter(Boolean).pop() ?? '/'
</script>

<template>
  <aside ref="tree" class="tree scroller" tabindex="-1" @keydown="typeAhead">
    <header class="crumb">
      <span class="crumb-label" :data-tip="cwd ?? ''">
        <AppIcon name="folder" />
        <span class="crumb-name">{{ cwd ? folderName(cwd) : '' }}</span>
      </span>
      <button
        class="icon-button"
        :disabled="atDocumentFolder"
        data-tip="Folder of current file"
        aria-label="Go to folder of current file"
        @click="load(props.dir)"
      >
        <AppIcon name="locate" />
      </button>
      <button
        class="icon-button"
        :disabled="!listing?.parent"
        data-tip="Parent folder"
        aria-label="Parent folder"
        @click="listing?.parent && load(listing.parent)"
      >
        <AppIcon name="up" />
      </button>
    </header>

    <p v-if="error" class="message">{{ error }}</p>
    <p v-else-if="listing && !listing.entries.length" class="message">Empty folder</p>

    <ul v-else class="rows">
      <li v-if="listing?.parent">
        <button class="row" @click="load(listing.parent)">
          <AppIcon name="up" class="glyph" />
          <span class="label">..</span>
        </button>
      </li>
      <li v-for="entry in listing?.entries ?? []" :key="entry.path">
        <button
          class="row"
          :data-kind="entry.kind"
          :data-active="entry.path === activePath"
          :disabled="entry.kind === 'other'"
          @click="activate(entry)"
        >
          <AppIcon :name="entry.kind === 'directory' ? 'folder' : 'file'" class="glyph" />
          <span class="label">{{ entry.name }}</span>
          <span v-if="entry.kind !== 'directory'" class="size">{{ formatSize(entry.size) }}</span>
        </button>
      </li>
    </ul>
  </aside>
</template>

<style scoped>
.tree {
  width: 244px;
  flex: none;
  height: 100%;
  padding-bottom: 20px;
  background: var(--chrome);
  border-right: 1px solid var(--chrome-border);
  user-select: none;
}

.tree:focus {
  outline: none;
}

.crumb {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 5px 9px 12px;
  background: var(--chrome);
  border-bottom: 1px solid var(--chrome-border);
}

.crumb-label {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.crumb svg {
  width: 14px;
  height: 14px;
  flex: none;
  color: var(--text-dim);
}

.crumb-name {
  min-width: 0;
  font-size: 12px;
  font-weight: 590;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.crumb .icon-button:disabled {
  opacity: 0.28;
}

/* Full paths are long, and this tooltip hangs under the left edge of the name. */
.crumb-label::after {
  right: auto;
  left: 0;
  max-width: 210px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.message {
  margin: 16px 12px;
  font-size: 12px;
  color: var(--text-dim);
}

.rows {
  margin: 4px 0 0;
  padding: 0 6px;
  list-style: none;
}

.row {
  display: flex;
  align-items: center;
  gap: 7px;
  width: 100%;
  padding: 4px 7px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  font-size: 12px;
  text-align: left;
  cursor: default;
}

.row:not(:disabled):hover {
  background: var(--hover);
}

.row[data-active='true'] {
  background: var(--accent);
  color: #fff;
}

.row:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: -2px;
}

.row[data-active='true']:focus-visible {
  outline-color: #fff;
}

/* The selected row still needs to react to the pointer. */
.row[data-active='true']:hover {
  background: var(--accent-hover);
}

.row[data-active='true'] .size,
.row[data-active='true'] .glyph {
  color: rgba(255, 255, 255, 0.75);
}

/* Files the app cannot open stay visible for orientation, but inert. */
.row:disabled {
  opacity: 0.42;
}

.glyph {
  width: 13px;
  height: 13px;
  flex: none;
  color: var(--text-dim);
}

.row[data-kind='directory'] .glyph {
  color: var(--accent);
}

.label {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.size {
  flex: none;
  font-size: 10.5px;
  color: var(--text-dim);
  font-variant-numeric: tabular-nums;
}
</style>
