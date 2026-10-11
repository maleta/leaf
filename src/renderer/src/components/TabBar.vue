<script setup lang="ts">
import AppIcon from './AppIcon.vue'
import type { Tab } from '../composables/useDocument'

defineProps<{ tabs: Tab[]; activePath: string | null; isDirty: (tab: Tab) => boolean }>()

const emit = defineEmits<{ activate: [path: string]; close: [path: string] }>()
</script>

<template>
  <nav class="tabbar" role="tablist">
    <div
      v-for="tab in tabs"
      :key="tab.path"
      class="tab"
      role="tab"
      :title="tab.path"
      :aria-selected="tab.path === activePath"
      @mousedown.left="emit('activate', tab.path)"
      @mousedown.middle.prevent="emit('close', tab.path)"
    >
      <span class="name">{{ tab.name }}</span>
      <span v-if="isDirty(tab)" class="dot" />
      <button
        class="close"
        aria-label="Close tab"
        @mousedown.stop
        @click="emit('close', tab.path)"
      >
        <AppIcon name="close" />
      </button>
    </div>
  </nav>
</template>

<style scoped>
.tabbar {
  display: flex;
  height: 30px;
  background: var(--chrome);
  border-bottom: 1px solid var(--chrome-border);
  user-select: none;
  overflow-x: auto;
  scrollbar-width: none;
}

.tab {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1 1 0;
  min-width: 90px;
  max-width: 220px;
  padding: 0 6px 0 12px;
  border-right: 1px solid var(--chrome-border);
  color: var(--text-dim);
  font-size: 12px;
  cursor: default;
}

.tab:hover {
  background: var(--hover);
}

.tab[aria-selected='true'] {
  background: var(--surface);
  color: var(--text);
}

.name {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dot {
  width: 6px;
  height: 6px;
  flex: none;
  border-radius: 50%;
  background: var(--text-dim);
}

.close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  flex: none;
  padding: 0;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--text-dim);
  visibility: hidden;
}

.close svg {
  width: 11px;
  height: 11px;
}

.tab:hover .close,
.tab[aria-selected='true'] .close {
  visibility: visible;
}

.close:hover {
  background: var(--active);
}
</style>
