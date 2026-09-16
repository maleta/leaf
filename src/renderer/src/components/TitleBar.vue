<script setup lang="ts">
import AppIcon from './AppIcon.vue'
import type { ViewMode } from '../composables/useSettings'

defineProps<{
  name: string
  isDirty: boolean
  hasFile: boolean
  view: ViewMode
  typing: boolean
  canReplay: boolean
  settingsOpen: boolean
  treeOpen: boolean
}>()

const emit = defineEmits<{
  open: []
  'toggle-tree': []
  reveal: []
  'toggle-view': []
  'toggle-settings': []
  replay: []
}>()
</script>

<template>
  <header class="titlebar">
    <div class="title" @dblclick="hasFile && emit('reveal')">
      <span class="name">{{ name }}</span>
      <span v-if="isDirty" class="dot" data-tip="Unsaved changes" />
    </div>

    <div class="actions">
      <button
        class="icon-button"
        :data-active="treeOpen"
        data-tip="File tree  ⌘B"
        aria-label="Toggle file tree"
        @click="emit('toggle-tree')"
      >
        <AppIcon name="tree" />
      </button>
      <button class="icon-button" data-tip="Open…  ⌘O" aria-label="Open file" @click="emit('open')">
        <AppIcon name="folder" />
      </button>
      <button
        v-if="hasFile && canReplay"
        class="icon-button"
        :data-active="typing"
        data-tip="Replay typing" aria-label="Replay typing animation"
        @click="emit('replay')"
      >
        <AppIcon name="play" />
      </button>
      <button
        class="icon-button"
        :data-active="view === 'split'"
        data-tip="Split editor  ⌘E" aria-label="Toggle split editor"
        @click="emit('toggle-view')"
      >
        <AppIcon :name="view === 'split' ? 'columns' : 'eye'" />
      </button>
      <button
        class="icon-button"
        :data-active="settingsOpen"
        data-tip="Settings  ⌘," aria-label="Settings"
        @click="emit('toggle-settings')"
      >
        <AppIcon name="gear" />
      </button>
    </div>
  </header>
</template>

<style scoped>
.titlebar {
  display: flex;
  align-items: center;
  height: var(--titlebar-height);
  padding: 0 8px 0 84px;
  background: var(--chrome);
  border-bottom: 1px solid var(--chrome-border);
  -webkit-app-region: drag;
  user-select: none;
}

.title {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  flex: 1;
}

.name {
  font-weight: 600;
  font-size: 13px;
  line-height: 20px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dot {
  position: relative;
  width: 7px;
  height: 7px;
  flex: none;
  border-radius: 50%;
  background: var(--text-dim);
}

.actions {
  display: flex;
  gap: 2px;
  -webkit-app-region: no-drag;
}
</style>
