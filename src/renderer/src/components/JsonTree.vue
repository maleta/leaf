<script setup lang="ts">
import JsonNode from './JsonNode.vue'
import type { JsonRecord } from '../json-records'

defineProps<{
  records: JsonRecord[]
  /** JSONL: one independent value per line. */
  lines: boolean
}>()

const openToDepth = (limit: number) => (depth: number) => depth < limit
const documentDefault = openToDepth(2)
const recordDefault = openToDepth(0)
</script>

<template>
  <div class="json-tree">
    <template v-if="lines">
      <div v-for="record in records" :key="record.line" class="record">
        <span class="line-number">{{ record.line }}</span>
        <span v-if="'error' in record" class="invalid">⚠ {{ record.error }}</span>
        <JsonNode
          v-else
          class="record-node"
          :label="null"
          :value="record.value"
          path=""
          :depth="0"
          :default-open="recordDefault"
          :branch="null"
        />
      </div>
    </template>
    <template v-else-if="'value' in records[0]">
      <JsonNode
        :label="null"
        :value="records[0].value"
        path=""
        :depth="0"
        :default-open="documentDefault"
        :branch="null"
        bare
      />
    </template>
  </div>
</template>

<style scoped>
.json-tree {
  font-family: 'SF Mono', ui-monospace, Menlo, monospace;
  font-size: 0.85em;
  line-height: 1.7;
}

.record {
  display: flex;
  align-items: baseline;
  gap: 0.75em;
}

.record-node {
  flex: 1;
  min-width: 0;
}

.line-number {
  min-width: 2.5em;
  text-align: right;
  color: var(--syntax-punct);
  user-select: none;
  flex-shrink: 0;
}

.invalid {
  color: var(--syntax-strong);
}
</style>
