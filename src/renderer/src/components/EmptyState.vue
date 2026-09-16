<script setup lang="ts">
import AppIcon from './AppIcon.vue'

const emit = defineEmits<{ open: [] }>()
</script>

<template>
  <div class="empty">
    <AppIcon name="file" class="glyph" />
    <p class="lead">Drop a Markdown file here</p>
    <p class="sub">or press <kbd>⌘O</kbd> to choose one</p>
    <button class="cta" @click="emit('open')">Open File…</button>
  </div>
</template>

<style scoped>
.empty {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 4px;
  color: var(--text-dim);
  user-select: none;
}

.glyph {
  width: 40px;
  height: 40px;
  margin-bottom: 10px;
  opacity: 0.4;
}

.lead {
  margin: 0;
  font-size: 14px;
  color: var(--text);
}

.sub {
  margin: 0 0 16px;
  font-size: 12px;
}

kbd {
  padding: 1px 5px;
  border: 1px solid var(--chrome-border);
  border-radius: 4px;
  background: var(--chrome);
  font: inherit;
  font-size: 11px;
}

.cta {
  padding: 5px 14px;
  border: 0;
  border-radius: 7px;
  background: var(--accent);
  color: #fff;
  font-size: 12.5px;
  cursor: default;
}
</style>
