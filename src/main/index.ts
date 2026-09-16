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
import { MARKDOWN_EXTENSIONS } from '../shared/types.js'

const bundleDir = fileURLToPath(new URL('.', import.meta.url))

interface WindowState {
  filePath?: string
  unwatch?: () => void
}

const windows = new Map<number, WindowState>()
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

  windows.set(window.id, {})

  window.on('ready-to-show', () => window.show())
  window.on('closed', () => {
    windows.get(window.id)?.unwatch?.()
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

  if (filePath) {
    window.webContents.once('did-finish-load', () => void openInWindow(window, filePath))
  }

  return window
}

async function openInWindow(window: BrowserWindow, filePath: string): Promise<void> {
  try {
    const document = await readDocument(filePath)
    attachToWindow(window, document)
    window.webContents.send('doc:opened', document)
  } catch (error) {
    dialog.showMessageBox(window, {
      type: 'error',
      message: `Could not open ${basename(filePath)}`,
      detail: error instanceof Error ? error.message : String(error)
    })
  }
}

function attachToWindow(window: BrowserWindow, document: Document): void {
  const state = windows.get(window.id)
  if (!state) return

  state.unwatch?.()
  state.filePath = document.path
  state.unwatch = watchDocument(document.path, async () => {
    try {
      const fresh = await readDocument(document.path)
      if (!window.isDestroyed()) window.webContents.send('doc:external-change', fresh)
    } catch {
      /* file was removed or is mid-write; the next event will settle it */
    }
  })

  window.setTitle(document.name)
  window.setRepresentedFilename(document.path)
  window.setDocumentEdited(false)
}

/** Reuses a window that has no file loaded, so Finder opens do not pile up blank windows. */
function targetWindow(): BrowserWindow | undefined {
  return BrowserWindow.getAllWindows().find((window) => !windows.get(window.id)?.filePath)
}

function handleFile(filePath: string): void {
  if (!ready) {
    pendingFiles.push(filePath)
    return
  }
  const existing = BrowserWindow.getAllWindows().find(
    (window) => windows.get(window.id)?.filePath === filePath
  )
  if (existing) {
    existing.focus()
    return
  }
  const window = targetWindow()
  if (window) {
    window.focus()
    void openInWindow(window, filePath)
    return
  }
  createWindow(filePath)
}

async function showOpenDialog(window?: BrowserWindow): Promise<void> {
  const owner = window ?? BrowserWindow.getFocusedWindow() ?? undefined
  const current = owner ? windows.get(owner.id)?.filePath : undefined
  const options: Electron.OpenDialogOptions = {
    // Start where the open document lives, not wherever macOS last left the picker.
    defaultPath: current ? dirname(current) : undefined,
    properties: ['openFile'],
    filters: [{ name: 'Markdown', extensions: MARKDOWN_EXTENSIONS }]
  }
  const result = owner
    ? await dialog.showOpenDialog(owner, options)
    : await dialog.showOpenDialog(options)
  if (result.canceled || !result.filePaths[0]) return
  if (owner && !current) {
    void openInWindow(owner, result.filePaths[0])
    return
  }
  handleFile(result.filePaths[0])
}

function filesFromArgv(argv: string[]): string[] {
  return argv
    .slice(app.isPackaged ? 1 : 2)
    .filter((arg) => !arg.startsWith('-'))
    .filter((arg) => MARKDOWN_EXTENSIONS.some((ext) => arg.toLowerCase().endsWith(`.${ext}`)))
}

// Must be registered before `ready`, otherwise Finder launches are dropped.
app.on('open-file', (event, filePath) => {
  event.preventDefault()
  handleFile(filePath)
})

app.on('second-instance', (_event, argv) => {
  const files = filesFromArgv(argv)
  if (files.length) files.forEach(handleFile)
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

  if (startupFiles.length) startupFiles.forEach(handleFile)
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

  ipcMain.handle('doc:reload', async (event) => {
    const { state } = stateFor(event)
    if (!state?.filePath) return null
    return readDocument(state.filePath)
  })

  ipcMain.handle('doc:open-path', async (event, filePath: string) => {
    const { window } = stateFor(event)
    if (!window) return
    await openInWindow(window, filePath)
  })

  ipcMain.handle('doc:save', async (event, content: string) => {
    const { window, state } = stateFor(event)
    if (!window || !state?.filePath) return null
    await writeDocument(state.filePath, content)
    window.setDocumentEdited(false)
    return state.filePath
  })

  ipcMain.handle('doc:save-as', async (event, content: string) => {
    const { window, state } = stateFor(event)
    if (!window) return null
    const result = await dialog.showSaveDialog(window, {
      defaultPath: state?.filePath ?? 'Untitled.md',
      filters: [{ name: 'Markdown', extensions: MARKDOWN_EXTENSIONS }]
    })
    if (result.canceled || !result.filePath) return null
    await writeDocument(result.filePath, content)
    attachToWindow(window, { path: result.filePath, name: basename(result.filePath), content })
    return result.filePath
  })

  ipcMain.handle('doc:reveal', (event) => {
    const { state } = stateFor(event)
    if (state?.filePath) shell.showItemInFolder(state.filePath)
  })

  ipcMain.handle('win:set-edited', (event, edited: boolean) => {
    const { window } = stateFor(event)
    window?.setDocumentEdited(edited)
  })

  ipcMain.handle('fs:list', async (event, dirPath?: string) => {
    const { state } = stateFor(event)
    const target = dirPath ?? (state?.filePath ? dirname(state.filePath) : homedir())
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
