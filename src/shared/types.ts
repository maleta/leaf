export interface Document {
  path: string
  name: string
  content: string
}

/** Extensions the app can open. Everything else is listed but not clickable. */
export const MARKDOWN_EXTENSIONS = ['md', 'markdown', 'mdown', 'mkd', 'mdx', 'txt']

export type EntryKind = 'directory' | 'markdown' | 'other'

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
  | 'reload-file'
  | 'zoom-in'
  | 'zoom-out'
  | 'zoom-reset'
