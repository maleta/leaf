export type JsonRecord = { line: number; value: unknown } | { line: number; error: string }

/** Drops the source echo and the offset from the engine's message; a JSONL line is always line 1 of itself. */
function describe(message: string, singleLine: boolean): string {
  return message
    .replace(/,\s*".*" is not valid JSON$/s, '')
    .replace(/ in JSON at position \d+ \(line (\d+) column (\d+)\)$/, (_, row: string, column: string) =>
      singleLine ? ` at column ${column}` : ` at line ${row}, column ${column}`
    )
    .replace(/ in JSON at position (\d+)$/, ' at position $1')
}

function parse(text: string, line: number, singleLine: boolean): JsonRecord {
  try {
    return { line, value: JSON.parse(text) }
  } catch (error) {
    return { line, error: describe((error as Error).message, singleLine) }
  }
}

/** Parses a JSON document as one record, or JSONL as one record per non-blank line. */
export function parseRecords(source: string, lines: boolean): JsonRecord[] {
  if (!lines) return [parse(source, 1, false)]
  return source
    .split(/\r?\n/)
    .map((text, index) => ({ text, line: index + 1 }))
    .filter(({ text }) => text.trim() !== '')
    .map(({ text, line }) => parse(text, line, true))
}
