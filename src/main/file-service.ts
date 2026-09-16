import { readFile, writeFile, readdir, stat } from 'node:fs/promises'
import { watch, type FSWatcher } from 'node:fs'
import { basename, dirname, extname, join } from 'node:path'
import {
  MARKDOWN_EXTENSIONS,
  type DirEntry,
  type DirListing,
  type Document,
  type EntryKind
} from '../shared/types.js'

export async function readDocument(filePath: string): Promise<Document> {
  return {
    path: filePath,
    name: basename(filePath),
    content: await readFile(filePath, 'utf8')
  }
}

export async function writeDocument(filePath: string, content: string): Promise<void> {
  await writeFile(filePath, content, 'utf8')
}

/**
 * Watches the containing directory rather than the file itself so that atomic
 * saves (write to temp + rename), which most editors use, are still detected.
 */
export function watchDocument(filePath: string, onChange: () => void): () => void {
  const target = basename(filePath)
  let timer: NodeJS.Timeout | undefined
  let watcher: FSWatcher

  try {
    watcher = watch(dirname(filePath), (_event, changed) => {
      if (changed !== target) return
      clearTimeout(timer)
      timer = setTimeout(onChange, 80)
    })
  } catch {
    return () => {}
  }

  return () => {
    clearTimeout(timer)
    watcher.close()
  }
}

const KIND_ORDER: Record<EntryKind, number> = { directory: 0, markdown: 1, other: 2 }

function classify(name: string, isDirectory: boolean): EntryKind {
  if (isDirectory) return 'directory'
  return MARKDOWN_EXTENSIONS.includes(extname(name).slice(1).toLowerCase()) ? 'markdown' : 'other'
}

/** Directories first, then openable documents, then the rest; each block by name. */
export async function listDirectory(dirPath: string): Promise<DirListing> {
  const dirents = await readdir(dirPath, { withFileTypes: true })

  const entries = await Promise.all(
    dirents
      .filter((entry) => !entry.name.startsWith('.'))
      .map(async (entry): Promise<DirEntry | null> => {
        const path = join(dirPath, entry.name)
        try {
          // stat rather than the dirent so symlinked directories sort as directories
          const stats = await stat(path)
          return {
            name: entry.name,
            path,
            kind: classify(entry.name, stats.isDirectory()),
            size: stats.isDirectory() ? 0 : stats.size
          }
        } catch {
          return null // vanished or unreadable between readdir and stat
        }
      })
  )

  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })
  const parent = dirname(dirPath)

  return {
    path: dirPath,
    parent: parent === dirPath ? null : parent,
    entries: entries
      .filter((entry): entry is DirEntry => entry !== null)
      .sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind] || collator.compare(a.name, b.name))
  }
}

export type { Document }
