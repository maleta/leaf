<script setup lang="ts">
import AppIcon from './AppIcon.vue'
import { SPEED_PRESETS, resetSettings, type Settings } from '../composables/useSettings'

defineProps<{ settings: Settings }>()
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <aside class="panel scroller">
    <div class="head">
      <h2>Settings</h2>
      <button class="icon-button" data-tip="Close  ⌘," aria-label="Close settings" @click="emit('close')">
        <AppIcon name="close" />
      </button>
    </div>

    <section>
      <h3>Rendering</h3>
      <p class="hint">How a document appears when you open or reload it.</p>
      <div class="segmented">
        <button
          v-for="mode in (['instant', 'typing'] as const)"
          :key="mode"
          :data-active="settings.renderMode === mode"
          @click="settings.renderMode = mode"
        >
          {{ mode === 'instant' ? 'Instant' : 'Typewriter' }}
        </button>
      </div>
    </section>

    <section v-if="settings.renderMode === 'typing'">
      <h3>Speed</h3>
      <div class="segmented">
        <button
          v-for="preset in SPEED_PRESETS"
          :key="preset.value"
          :data-active="settings.charsPerSecond === preset.value"
          @click="settings.charsPerSecond = preset.value"
        >
          {{ preset.label }}
        </button>
      </div>
      <label class="row">
        <input
          v-model.number="settings.charsPerSecond"
          type="range"
          min="100"
          max="12000"
          step="100"
        />
        <span class="value">{{ settings.charsPerSecond }} ch/s</span>
      </label>
      <label class="row toggle">
        <input v-model="settings.caret" type="checkbox" />
        <span>Show caret while typing</span>
      </label>
    </section>

    <section>
      <h3>Animation</h3>
      <label class="row toggle">
        <input v-model="settings.animate" type="checkbox" />
        <span>Fade in new content</span>
      </label>
      <div v-if="settings.animate" class="segmented">
        <button
          v-for="split in (['auto', 'word', 'char'] as const)"
          :key="split"
          :data-active="settings.animationSplit === split"
          @click="settings.animationSplit = split"
        >
          {{ split }}
        </button>
      </div>
    </section>

    <section>
      <h3>Appearance</h3>
      <div class="segmented">
        <button
          v-for="theme in (['system', 'light', 'dark'] as const)"
          :key="theme"
          :data-active="settings.theme === theme"
          @click="settings.theme = theme"
        >
          {{ theme }}
        </button>
      </div>
      <label class="row">
        <input v-model.number="settings.fontScale" type="range" min="0.8" max="1.6" step="0.05" />
        <span class="value">{{ Math.round(settings.fontScale * 100) }}%</span>
      </label>
    </section>

    <section>
      <h3>Editing</h3>
      <p class="hint">Which layout new documents open in.</p>
      <div class="segmented">
        <button
          v-for="view in (['preview', 'split'] as const)"
          :key="view"
          :data-active="settings.defaultView === view"
          @click="settings.defaultView = view"
        >
          {{ view }}
        </button>
      </div>
      <label class="row toggle">
        <input v-model="settings.syncScroll" type="checkbox" />
        <span>Sync scrolling in split view</span>
      </label>
    </section>

    <button class="reset" @click="resetSettings">Reset to defaults</button>
  </aside>
</template>

<style scoped>
.panel {
  width: 268px;
  flex: none;
  height: 100%;
  padding: 16px 16px 32px;
  background: var(--chrome);
  border-left: 1px solid var(--chrome-border);
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

h2 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

h3 {
  margin: 0 0 6px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-dim);
}

section {
  padding: 14px 0;
  border-bottom: 1px solid var(--chrome-border);
}

.hint {
  margin: -2px 0 8px;
  font-size: 11.5px;
  color: var(--text-dim);
}

.segmented {
  display: flex;
  gap: 2px;
  padding: 2px;
  border-radius: 7px;
  background: var(--hover);
}

.segmented button {
  flex: 1;
  padding: 4px 0;
  border: 0;
  border-radius: 5px;
  background: transparent;
  font-size: 12px;
  text-transform: capitalize;
  color: var(--text-dim);
  cursor: default;
}

.segmented button[data-active='true'] {
  background: var(--surface);
  color: var(--text);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
}

.row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  font-size: 12px;
}

.row input[type='range'] {
  flex: 1;
  accent-color: var(--accent);
}

.row.toggle {
  cursor: default;
}

.row.toggle input {
  accent-color: var(--accent);
}

.value {
  min-width: 62px;
  text-align: right;
  color: var(--text-dim);
  font-variant-numeric: tabular-nums;
}

.reset {
  margin-top: 16px;
  width: 100%;
  padding: 6px;
  border: 1px solid var(--chrome-border);
  border-radius: 7px;
  background: transparent;
  font-size: 12px;
  color: var(--text-dim);
  cursor: default;
}

.reset:hover {
  background: var(--hover);
  color: var(--text);
}
</style>
