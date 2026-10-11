<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Markdown } from 'vue-stream-markdown'
import { code } from '@stream-markdown/code'
import { math } from '@stream-markdown/math'
import { mermaid } from '@stream-markdown/mermaid'
import type { Settings } from '../composables/useSettings'

const emit = defineEmits<{ ready: [scroller: HTMLElement] }>()
const root = ref<HTMLElement | null>(null)

onMounted(() => root.value && emit('ready', root.value))

defineProps<{
  content: string
  /** A plain-text document, rendered as one code block. */
  verbatim: boolean
  isDark: boolean
  streaming: boolean
  settings: Settings
}>()

/** Disabling every CDN module makes the extensions fall back to the bundled
 *  copies of shiki/katex/mermaid, so the app renders with no network. */
const cdnOptions = { shiki: false, mermaid: false, katex: false, beautifulMermaid: false } as const

const extensions = {
  code: code({ cdnOptions, theme: () => ['github-light', 'github-dark'] as const }),
  math: math({ cdnOptions }),
  mermaid: mermaid({ cdnOptions })
}
</script>

<template>
  <div ref="root" class="preview scroller" :class="{ verbatim }" :style="{ fontSize: `${settings.fontScale}rem` }">
    <Markdown
      :content="content"
      :mode="streaming ? 'streaming' : 'static'"
      :is-dark="isDark"
      :extensions="extensions"
      :enable-animate="settings.animate && streaming"
      :animation-split="settings.animationSplit"
      :caret="settings.caret && streaming ? 'block' : undefined"
      animation="fade-in"
      dir="auto"
    />
  </div>
</template>

<style scoped>
.preview {
  height: 100%;
  padding: 26px 34px 60px;
}

.preview :deep(.stream-markdown) {
  max-width: 46rem;
  margin: 0 auto;
}

.preview.verbatim :deep(pre) {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

/* Out of the text flow, the line number cannot be wrapped away from its line. */
.preview.verbatim :deep([data-stream-markdown='code-line']) {
  padding-left: 2rem;
}

.preview.verbatim :deep([data-stream-markdown='code-line'])::before {
  position: absolute;
  left: 0;
}
</style>
