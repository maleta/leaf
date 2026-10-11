<script setup lang="ts">
import { computed, ref, watch } from 'vue'

/** A request from an ancestor to open or close its whole branch; `token` makes repeats observable. */
export interface BranchToggle {
  open: boolean
  token: number
}

const props = defineProps<{
  label: string | number | null
  value: unknown
  path: string
  depth: number
  defaultOpen: (depth: number) => boolean
  branch: BranchToggle | null
  /** Width of the key column shared with siblings, in characters. */
  keyWidth?: number
  /** Renders only the children, for a document root whose own row says nothing. */
  bare?: boolean
}>()

const isContainer = computed(() => props.value !== null && typeof props.value === 'object')
const isArray = computed(() => Array.isArray(props.value))

const entries = computed((): [string | number, unknown][] => {
  if (!isContainer.value) return []
  return isArray.value
    ? (props.value as unknown[]).map((item, index) => [index, item])
    : Object.entries(props.value as Record<string, unknown>)
})

const open = ref(props.branch ? props.branch.open : props.defaultOpen(props.depth))
const childBranch = ref<BranchToggle | null>(props.branch)

watch(
  () => props.branch,
  (request) => {
    if (!request) return
    open.value = request.open
    childBranch.value = request
  }
)

let tokens = 0

function toggle(event: MouseEvent): void {
  if (!isContainer.value) return
  open.value = !open.value
  if (event.altKey) childBranch.value = { open: open.value, token: ++tokens }
}

function childPath(key: string | number): string {
  if (typeof key === 'number') return `${props.path}[${key}]`
  if (/^[A-Za-z_$][\w$]*$/.test(key)) return props.path ? `${props.path}.${key}` : key
  return `${props.path}[${JSON.stringify(key)}]`
}

const hasChildren = computed(() => entries.value.length > 0)
const showRow = computed(() => !props.bare || !isContainer.value)

const KEY_COLUMN_MAX = 12

/** Keys longer than the column push only their own value, so one outlier does not widen every row. */
const childKeyWidth = computed(() => {
  const widths = entries.value.map(([key]) => String(key).length).filter((w) => w <= KEY_COLUMN_MAX)
  return Math.max(0, ...widths)
})

const count = computed(() => {
  const n = entries.value.length
  if (isArray.value) return n === 1 ? '1 item' : `${n} items`
  return n === 1 ? '1 key' : `${n} keys`
})

function scalarClass(value: unknown): string {
  return value === null ? 'null' : typeof value
}

function short(value: unknown): string {
  if (Array.isArray(value)) return value.length ? '[…]' : '[]'
  if (value !== null && typeof value === 'object') return Object.keys(value).length ? '{…}' : '{}'
  return JSON.stringify(value)
}

const SUMMARY_ENTRIES = 5

/** The first entries inline, enough to recognise a collapsed record. */
const summary = computed(() => {
  const shown = entries.value
    .slice(0, SUMMARY_ENTRIES)
    .map(([key, item]) => (isArray.value ? short(item) : `${key}: ${short(item)}`))
  if (entries.value.length > SUMMARY_ENTRIES) shown.push('…')
  const [start, end] = isArray.value ? ['[', ']'] : ['{', '}']
  return shown.length ? `${start} ${shown.join(', ')} ${end}` : `${start}${end}`
})

const copied = ref(false)

async function copyPath(): Promise<void> {
  await navigator.clipboard.writeText(props.path)
  copied.value = true
  setTimeout(() => (copied.value = false), 1000)
}
</script>

<template>
  <div class="node">
    <div v-if="showRow" class="row" :class="{ container: hasChildren }" @click="toggle">
      <span class="caret" :class="{ open, hidden: !hasChildren }">▸</span>
      <span
        v-if="label !== null"
        class="key"
        :class="{ index: typeof label === 'number' }"
        :style="keyWidth ? { minWidth: `${typeof label === 'number' ? keyWidth : keyWidth + 1}ch` } : undefined"
        >{{ label }}<span v-if="typeof label === 'string'" class="colon">:</span></span
      >
      <template v-if="isContainer">
        <span v-if="open && hasChildren" class="count">{{ count }}</span>
        <span v-else class="summary">{{ summary }}</span>
      </template>
      <span v-else class="scalar" :class="scalarClass(value)">{{ JSON.stringify(value) }}</span>
      <button v-if="path" class="copy" :class="{ copied }" :title="path" @click.stop="copyPath">
        {{ copied ? 'copied' : 'copy path' }}
      </button>
    </div>
    <div v-if="isContainer && open && hasChildren" class="children" :class="{ bare: !showRow }">
      <JsonNode
        v-for="[key, item] in entries"
        :key="key"
        :label="key"
        :value="item"
        :path="childPath(key)"
        :depth="depth + 1"
        :default-open="defaultOpen"
        :branch="childBranch"
        :key-width="childKeyWidth"
      />
    </div>
  </div>
</template>

<style scoped>
.row {
  display: flex;
  align-items: baseline;
  gap: 0.5em;
  min-height: 1.7em;
  margin: 0 -0.4em;
  padding: 0 0.4em;
  border-radius: 5px;
}

.row:hover {
  background: var(--hover);
}

.caret {
  display: inline-block;
  width: 1em;
  flex-shrink: 0;
  text-align: center;
  color: var(--syntax-punct);
  font-size: 0.8em;
  transition: transform 0.12s ease;
  user-select: none;
}

.caret.open {
  transform: rotate(90deg);
}

.caret.hidden {
  visibility: hidden;
}

.key {
  flex-shrink: 0;
  color: var(--syntax-heading);
}

.key.index {
  text-align: right;
  color: var(--syntax-punct);
}

.colon {
  color: var(--syntax-punct);
}

.count {
  color: var(--syntax-punct);
  font-size: 0.85em;
  user-select: none;
}

.summary {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--text-dim);
}

.scalar {
  min-width: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.scalar.string {
  color: var(--syntax-code);
}

.scalar.number,
.scalar.boolean,
.scalar.null {
  color: var(--syntax-strong);
}

/* The guide hangs from the parent's caret, and children start under the parent's key. */
.children {
  margin-left: calc(0.4em - 0.5px);
  padding-left: calc(0.9em - 0.5px);
  border-left: 1px solid var(--chrome-border);
}

.children.bare {
  margin-left: 0;
  padding-left: 0;
  border-left: 0;
}

.copy {
  margin-left: auto;
  flex-shrink: 0;
  visibility: hidden;
  border: 0;
  border-radius: 4px;
  padding: 0 0.5em;
  background: var(--active);
  color: var(--text-dim);
  font: inherit;
  font-size: 0.8em;
}

.row:hover .copy,
.copy.copied {
  visibility: visible;
}

.copy:hover {
  background: var(--active-hover);
  color: var(--text);
}
</style>
