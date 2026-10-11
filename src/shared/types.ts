export interface Document {
  path: string
  name: string
  content: string
}

export const MARKDOWN_EXTENSIONS = ['md', 'markdown', 'mdown', 'mkd', 'mdx']

/** Formats shown verbatim rather than rendered, mapped to the shiki language that highlights them. */
export const TEXT_EXTENSIONS: Record<string, string> = {
  txt: 'text',
  text: 'text',
  log: 'log',
  json: 'json',
  jsonl: 'jsonl'
}

/** Extensions the app can open. Everything else is listed but not clickable. */
export const OPENABLE_EXTENSIONS = [...MARKDOWN_EXTENSIONS, ...Object.keys(TEXT_EXTENSIONS)]

function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot < 0 ? '' : name.slice(dot + 1).toLowerCase()
}

export function isOpenable(name: string): boolean {
  return OPENABLE_EXTENSIONS.includes(extensionOf(name))
}

/** The highlighting language for a verbatim document, or null when the file is markdown. */
export function textLanguage(name: string): string | null {
  return TEXT_EXTENSIONS[extensionOf(name)] ?? null
}

export type EntryKind = 'directory' | 'document' | 'other'

export interface DirEntry {
  name: string
  path: string
  kind: EntryKind
  size: number
}

export interface DirListing {
  path: string
  parent: string | null
  entries: DirEntry[]
}

export type MenuCommand =
  | 'open'
  | 'save'
  | 'save-as'
  | 'toggle-split'
  | 'toggle-settings'
  | 'toggle-tree'
  | 'close-tab'
  | 'next-tab'
  | 'previous-tab'
  | 'reload-file'
  | 'zoom-in'
  | 'zoom-out'
  | 'zoom-reset'
