<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Markdown } from 'vue-stream-markdown'
import { code } from '@stream-markdown/code'
import { math } from '@stream-markdown/math'
import { mermaid } from '@stream-markdown/mermaid'
import type { Settings } from '../composables/useSettings'
import { parseRecords } from '../json-records'
import JsonTree from './JsonTree.vue'

const emit = defineEmits<{ ready: [scroller: HTMLElement] }>()
const root = ref<HTMLElement | null>(null)

onMounted(() => root.value && emit('ready', root.value))

const props = defineProps<{
  content: string
  /** The document as written, before any fencing. */
  source: string
  /** Highlighting language of a plain-text document, rendered as one code block; null for markdown. */
  language: string | null
  isDark: boolean
  streaming: boolean
  settings: Settings
}>()

/** Disabling every CDN module makes the extensions fall back to the bundled
 *  copies of shiki/katex/mermaid, so the app renders with no network. */
const cdnOptions = { shiki: false, mermaid: false, katex: false, beautifulMermaid: false } as const

const verbatim = computed(() => props.language !== null)
const structured = computed(() => props.language === 'json' || props.language === 'jsonl')

const records = computed(() =>
  structured.value ? parseRecords(props.source, props.language === 'jsonl') : []
)
/** A JSON document that does not parse is shown as highlighted text; JSONL flags bad lines instead. */
const parseError = computed(() => {
  const [first] = records.value
  return props.language === 'json' && first && 'error' in first ? first.error : null
})
const showTree = computed(() => structured.value && parseError.value === null)

const extensions = {
  code: code({ cdnOptions, theme: () => ['github-light', 'github-dark'] as const }),
  math: math({ cdnOptions }),
  mermaid: mermaid({ cdnOptions })
}
</script>

<template>
  <div ref="root" class="preview scroller" :class="{ verbatim }" :style="{ fontSize: `${settings.fontScale}rem` }">
    <div v-if="parseError" class="parse-error" role="alert">
      <span class="parse-error-icon">⚠</span>
      <span><strong>Invalid JSON</strong> {{ parseError }}</span>
    </div>
    <JsonTree v-if="showTree" :records="records" :lines="language === 'jsonl'" />
    <Markdown
      v-else
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
  /* Inset of the page edge from the content column. */
  --edge: calc(50% - 23rem - 28px);
  height: 100%;
  padding: 26px 34px 60px;
  /* The content column reads as a page lying on a desk; a pane narrower than the column has no margins. */
  background:
    linear-gradient(
      to right,
      transparent calc(var(--edge) - 6px),
      color-mix(in srgb, var(--page-shadow) 35%, transparent) calc(var(--edge) - 3px),
      var(--page-shadow) calc(var(--edge) - 1px),
      var(--page-edge) calc(var(--edge) - 1px) var(--edge),
      transparent var(--edge)
    ),
    linear-gradient(
      to left,
      transparent calc(var(--edge) - 6px),
      color-mix(in srgb, var(--page-shadow) 35%, transparent) calc(var(--edge) - 3px),
      var(--page-shadow) calc(var(--edge) - 1px),
      var(--page-edge) calc(var(--edge) - 1px) var(--edge),
      transparent var(--edge)
    ),
    linear-gradient(
      to right,
      var(--page-margin) var(--edge),
      var(--surface) var(--edge) calc(100% - var(--edge)),
      var(--page-margin) calc(100% - var(--edge))
    );
}

.preview :deep(.stream-markdown) {
  max-width: 46rem;
  margin: 0 auto;
}

.parse-error {
  display: flex;
  align-items: baseline;
  gap: 10px;
  max-width: 46rem;
  margin: 0 auto 16px;
  padding: 10px 14px;
  border: 1px solid color-mix(in srgb, var(--syntax-strong) 30%, transparent);
  border-radius: 10px;
  background: color-mix(in srgb, var(--syntax-strong) 8%, transparent);
  color: var(--text);
  font-size: 13px;
  line-height: 1.5;
}

.parse-error-icon,
.parse-error strong {
  color: var(--syntax-strong);
}

.parse-error strong {
  margin-right: 6px;
  font-weight: 600;
}

.json-tree {
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
