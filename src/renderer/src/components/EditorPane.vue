<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Compartment, EditorState, type Extension } from '@codemirror/state'
import { EditorView, keymap, highlightActiveLine, lineNumbers } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { markdown } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import { HighlightStyle, LanguageDescription, syntaxHighlighting } from '@codemirror/language'
import { tags } from '@lezer/highlight'
import { textLanguage } from '../../../shared/types'

const props = defineProps<{
  modelValue: string
  fileName: string
  isDark: boolean
  fontScale: number
}>()
const emit = defineEmits<{
  'update:modelValue': [value: string]
  ready: [scroller: HTMLElement]
}>()

const host = ref<HTMLElement | null>(null)
let view: EditorView | undefined

/** Colours come from CSS variables so the editor follows the app theme. */
const highlight = HighlightStyle.define([
  { tag: tags.heading, color: 'var(--syntax-heading)', fontWeight: '650' },
  { tag: tags.strong, color: 'var(--syntax-strong)', fontWeight: '650' },
  { tag: tags.emphasis, color: 'var(--syntax-strong)', fontStyle: 'italic' },
  { tag: tags.link, color: 'var(--accent)' },
  { tag: tags.url, color: 'var(--accent)', textDecoration: 'underline' },
  { tag: tags.monospace, color: 'var(--syntax-code)' },
  { tag: tags.quote, color: 'var(--text-dim)', fontStyle: 'italic' },
  { tag: tags.list, color: 'var(--syntax-punct)' },
  { tag: tags.strikethrough, textDecoration: 'line-through' },
  { tag: [tags.processingInstruction, tags.meta], color: 'var(--syntax-punct)' },
  { tag: tags.propertyName, color: 'var(--syntax-heading)' },
  { tag: tags.string, color: 'var(--syntax-code)' },
  { tag: [tags.number, tags.bool, tags.null], color: 'var(--syntax-strong)' }
])

const language = new Compartment()

/** Markdown is bundled; other grammars load on demand, and plain text has none. */
async function loadLanguage(fileName: string): Promise<Extension> {
  if (textLanguage(fileName) === null) return markdown({ codeLanguages: languages })
  const description = LanguageDescription.matchFilename(languages, fileName)
  return description ? await description.load() : []
}

async function applyLanguage(): Promise<void> {
  const fileName = props.fileName
  const extension = await loadLanguage(fileName)
  // The file may have changed, or the view been rebuilt, while the grammar loaded.
  if (!view || fileName !== props.fileName) return
  view.dispatch({ effects: language.reconfigure(extension) })
}

const theme = (isDark: boolean): Extension =>
  EditorView.theme(
    {
      '&': { height: '100%', backgroundColor: 'transparent', color: 'var(--text)' },
      '.cm-scroller': {
        fontFamily: "'SF Mono', ui-monospace, Menlo, monospace",
        lineHeight: '1.65',
        padding: '18px 0 60px'
      },
      '.cm-content': { caretColor: 'var(--accent)' },
      '.cm-gutters': {
        backgroundColor: 'transparent',
        color: 'var(--text-dim)',
        border: 'none',
        opacity: '0.5'
      },
      '.cm-activeLine': { backgroundColor: 'var(--hover)' },
      '.cm-cursor': { borderLeftColor: 'var(--accent)' },
      '&.cm-focused': { outline: 'none' },
      '.cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection': {
        backgroundColor: isDark ? 'rgba(91,140,255,0.28)' : 'rgba(47,109,246,0.18)'
      }
    },
    { dark: isDark }
  )

function build(): void {
  if (!host.value) return
  view?.destroy()
  view = new EditorView({
    parent: host.value,
    state: EditorState.create({
      doc: props.modelValue,
      extensions: [
        lineNumbers(),
        history(),
        highlightActiveLine(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        language.of([]),
        syntaxHighlighting(highlight),
        EditorView.lineWrapping,
        theme(props.isDark),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) emit('update:modelValue', update.state.doc.toString())
        })
      ]
    })
  })
  emit('ready', view.scrollDOM)
  void applyLanguage()
}

onMounted(build)
onBeforeUnmount(() => view?.destroy())

watch(() => props.isDark, build)
watch(() => props.fileName, applyLanguage)

watch(
  () => props.modelValue,
  (value) => {
    if (!view || value === view.state.doc.toString()) return
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } })
  }
)

defineExpose({ focus: () => view?.focus() })
</script>

<template>
  <div ref="host" class="editor" :style="{ fontSize: `${13 * fontScale}px` }" />
</template>

<style scoped>
.editor {
  height: 100%;
  overflow: hidden;
}
</style>
