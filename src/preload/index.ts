import { contextBridge, ipcRenderer, webUtils, type IpcRendererEvent } from 'electron'
import type { DirListing, Document, MenuCommand } from '../shared/types'

function subscribe<T>(channel: string, handler: (payload: T) => void): () => void {
  const listener = (_event: IpcRendererEvent, payload: T): void => handler(payload)
  ipcRenderer.on(channel, listener)
  return () => ipcRenderer.off(channel, listener)
}

const api = {
  openDialog: (): Promise<void> => ipcRenderer.invoke('doc:open-dialog'),
  read: (filePath: string): Promise<Document> => ipcRenderer.invoke('doc:read', filePath),
  restore: (): Promise<{ documents: Document[]; active: string | null }> =>
    ipcRenderer.invoke('win:restore'),
  syncTabs: (tabs: string[], active: string | null): Promise<void> =>
    ipcRenderer.invoke('win:sync-tabs', tabs, active),
  save: (filePath: string, content: string): Promise<string | null> =>
    ipcRenderer.invoke('doc:save', filePath, content),
  saveAs: (filePath: string | null, content: string): Promise<string | null> =>
    ipcRenderer.invoke('doc:save-as', filePath, content),
  reveal: (filePath: string): Promise<void> => ipcRenderer.invoke('doc:reveal', filePath),
  listDirectory: (dirPath?: string): Promise<DirListing> => ipcRenderer.invoke('fs:list', dirPath),
  confirmDiscard: (name: string): Promise<boolean> =>
    ipcRenderer.invoke('doc:confirm-discard', name),
  setEdited: (edited: boolean): Promise<void> => ipcRenderer.invoke('win:set-edited', edited),
  openExternal: (url: string): Promise<void> => ipcRenderer.invoke('shell:open-external', url),
  /** Electron no longer exposes File.path in the renderer. */
  pathForFile: (file: File): string => webUtils.getPathForFile(file),

  onOpened: (handler: (document: Document) => void) => subscribe('doc:opened', handler),
  onExternalChange: (handler: (document: Document) => void) =>
    subscribe('doc:external-change', handler),
  onMenuCommand: (handler: (command: MenuCommand) => void) => subscribe('menu:command', handler)
}

export type MdPreviewApi = typeof api

contextBridge.exposeInMainWorld('mdPreview', api)
