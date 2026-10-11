import { app, BrowserWindow, dialog, ipcMain, nativeTheme, shell } from 'electron'
import { fileURLToPath } from 'node:url'
import { homedir } from 'node:os'
import { join, basename, dirname } from 'node:path'
import {
  readDocument,
  writeDocument,
  watchDocument,
  listDirectory,
  type Document
} from './file-service.js'
import { buildMenu } from './menu.js'
import { isOpenable, OPENABLE_EXTENSIONS } from '../shared/types.js'

const bundleDir = fileURLToPath(new URL('.', import.meta.url))

/** Mirrors the renderer's tabs, which own the documents themselves. */
interface WindowState {
  tabs: string[]
  active?: string
  watchers: Map<string, () => void>
  /** Some tab holds unsaved edits. */
  edited: boolean
}

const windows = new Map<number, WindowState>()
let lastFocusedId: number | undefined
/** Files requested by Finder before the app finished starting. */
const pendingFiles: string[] = []
let ready = false

function stateFor(event: Electron.IpcMainInvokeEvent): {
  window: BrowserWindow | null
  state: WindowState | undefined
} {
  const window = BrowserWindow.fromWebContents(event.sender)
  return { window, state: window ? windows.get(window.id) : undefined }
}

function createWindow(filePath?: string): BrowserWindow {
  const window = new BrowserWindow({
    width: 1180,
    height: 820,
    minWidth: 520,
    minHeight: 400,
    show: false,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 14, y: 16 },
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#16181d' : '#ffffff',
    webPreferences: {
      preload: join(bundleDir, '../preload/index.mjs'),
      sandbox: false,
      // Chromium stalls requestAnimationFrame in occluded windows, which would
      // freeze the typewriter mid-document.
      backgroundThrottling: false
    }
  })

  windows.set(window.id, { tabs: [], watchers: new Map(), edited: false })

  window.on('ready-to-show', () => window.show())
  window.on('focus', () => (lastFocusedId = window.id))
  window.on('close', (event) => {
    if (!windows.get(window.id)?.edited) return
    const response = dialog.showMessageBoxSync(window, {
      type: 'warning',
      buttons: ['Discard Changes', 'Cancel'],
      defaultId: 1,
      cancelId: 1,
      message: 'Close this window and discard unsaved changes?'
    })
    if (response !== 0) event.preventDefault()
  })
  window.on('closed', () => {
    windows.get(window.id)?.watchers.forEach((unwatch) => unwatch())
    windows.delete(window.id)
  })

  window.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    window.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    window.loadFile(join(bundleDir, '../renderer/index.html'))
  }

  if (filePath) void openInWindow(window, filePath)

  return window
}

/** Hands a file to the window's renderer, which shows it in a new tab or focuses the tab holding it. */
async function openInWindow(window: BrowserWindow, filePath: string): Promise<void> {
  try {
    const document = await readDocument(filePath)
    const send = (): void => window.webContents.send('doc:opened', document)
    // Anything sent before the renderer has loaded is dropped.
    if (window.webContents.isLoading()) window.webContents.once('did-finish-load', send)
    else send()
  } catch (error) {
    dialog.showMessageBox(window, {
      type: 'error',
      message: `Could not open ${basename(filePath)}`,
      detail: error instanceof Error ? error.message : String(error)
    })
  }
}

function syncTabs(window: BrowserWindow, tabs: string[], active?: string): void {
  const state = windows.get(window.id)
  if (!state) return

  state.tabs = tabs
  state.active = active
  for (const [path, unwatch] of state.watchers) {
    if (tabs.includes(path)) continue
    unwatch()
    state.watchers.delete(path)
  }
  for (const path of tabs) {
    if (state.watchers.has(path)) continue
    state.watchers.set(
      path,
      watchDocument(path, async () => {
        try {
          const fresh = await readDocument(path)
          if (!window.isDestroyed()) window.webContents.send('doc:external-change', fresh)
        } catch {
          /* file was removed or is mid-write; the next event will settle it */
        }
      })
    )
  }

  window.setTitle(active ? basename(active) : app.name)
  window.setRepresentedFilename(active ?? '')
}

/** The window a new file joins: the given one, else the one the user was last in. */
function targetWindow(preferred?: BrowserWindow): BrowserWindow | undefined {
  if (preferred && !preferred.isDestroyed()) return preferred
  const all = BrowserWindow.getAllWindows()
  return all.find((window) => window.id === lastFocusedId) ?? all[0]
}

function handleFile(filePath: string, preferred?: BrowserWindow): void {
  if (!ready) {
    pendingFiles.push(filePath)
    return
  }
  const window =
    BrowserWindow.getAllWindows().find((candidate) =>
      windows.get(candidate.id)?.tabs.includes(filePath)
    ) ?? targetWindow(preferred)
  if (!window) {
    createWindow(filePath)
    return
  }
  window.focus()
  void openInWindow(window, filePath)
}

async function showOpenDialog(window?: BrowserWindow): Promise<void> {
  const owner = window ?? BrowserWindow.getFocusedWindow() ?? undefined
  const current = owner ? windows.get(owner.id)?.active : undefined
  const options: Electron.OpenDialogOptions = {
    // Start where the open document lives, not wherever macOS last left the picker.
    defaultPath: current ? dirname(current) : undefined,
    properties: ['openFile'],
    filters: [{ name: 'Documents', extensions: OPENABLE_EXTENSIONS }]
  }
  const result = owner
    ? await dialog.showOpenDialog(owner, options)
    : await dialog.showOpenDialog(options)
  if (result.canceled || !result.filePaths[0]) return
  handleFile(result.filePaths[0], owner)
}

function filesFromArgv(argv: string[]): string[] {
  return argv
    .slice(app.isPackaged ? 1 : 2)
    .filter((arg) => !arg.startsWith('-'))
    .filter(isOpenable)
}

// Must be registered before `ready`, otherwise Finder launches are dropped.
app.on('open-file', (event, filePath) => {
  event.preventDefault()
  handleFile(filePath)
})

app.on('second-instance', (_event, argv) => {
  const files = filesFromArgv(argv)
  if (files.length) files.forEach((file) => handleFile(file))
  else createWindow()
})

if (!app.requestSingleInstanceLock()) app.quit()

app.whenReady().then(() => {
  registerIpc()
  buildMenu({
    openDialog: showOpenDialog,
    newWindow: () => createWindow(),
    send: (command) => BrowserWindow.getFocusedWindow()?.webContents.send('menu:command', command)
  })

  ready = true
  const startupFiles = [...pendingFiles, ...filesFromArgv(process.argv)]
  pendingFiles.length = 0

  if (startupFiles.length) startupFiles.forEach((file) => handleFile(file))
  else createWindow()

  app.on('activate', () => {
    if (!BrowserWindow.getAllWindows().length) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

function registerIpc(): void {
  ipcMain.handle('doc:open-dialog', async (event) => {
    const { window } = stateFor(event)
    await showOpenDialog(window ?? undefined)
  })

  ipcMain.handle('doc:read', (_event, filePath: string) => readDocument(filePath))

  /** What the window held before its renderer reloaded, so the tabs come back. */
  ipcMain.handle('win:restore', async (event) => {
    const { state } = stateFor(event)
    const documents = await Promise.all(
      (state?.tabs ?? []).map((path) => readDocument(path).catch(() => null))
    )
    return {
      documents: documents.filter((document): document is Document => document !== null),
      active: state?.active ?? null
    }
  })

  ipcMain.handle('win:sync-tabs', (event, tabs: string[], active: string | null) => {
    const { window } = stateFor(event)
    if (window) syncTabs(window, tabs, active ?? undefined)
  })

  ipcMain.handle('doc:save', async (_event, filePath: string, content: string) => {
    await writeDocument(filePath, content)
    return filePath
  })

  ipcMain.handle('doc:save-as', async (event, filePath: string | null, content: string) => {
    const { window } = stateFor(event)
    if (!window) return null
    const result = await dialog.showSaveDialog(window, {
      defaultPath: filePath ?? 'Untitled.md',
      filters: [{ name: 'Documents', extensions: OPENABLE_EXTENSIONS }]
    })
    if (result.canceled || !result.filePath) return null
    await writeDocument(result.filePath, content)
    return result.filePath
  })

  ipcMain.handle('doc:reveal', (_event, filePath: string) => shell.showItemInFolder(filePath))

  ipcMain.handle('win:set-edited', (event, edited: boolean) => {
    const { window, state } = stateFor(event)
    if (state) state.edited = edited
    window?.setDocumentEdited(edited)
  })

  ipcMain.handle('fs:list', async (event, dirPath?: string) => {
    const { state } = stateFor(event)
    const target = dirPath ?? (state?.active ? dirname(state.active) : homedir())
    return listDirectory(target)
  })

  ipcMain.handle('doc:confirm-discard', async (event, name: string) => {
    const { window } = stateFor(event)
    if (!window) return true
    const { response } = await dialog.showMessageBox(window, {
      type: 'warning',
      buttons: ['Discard Changes', 'Cancel'],
      defaultId: 1,
      cancelId: 1,
      message: `Discard unsaved changes to ${name}?`
    })
    return response === 0
  })

  ipcMain.handle('shell:open-external', (_event, url: string) => shell.openExternal(url))
}
