import { app, Menu, shell, type BrowserWindow } from 'electron'
import type { MenuCommand } from '../shared/types.js'

export function buildMenu(handlers: {
  openDialog: (window?: BrowserWindow) => void
  newWindow: () => void
  send: (command: MenuCommand) => void
}): void {
  const send = (command: MenuCommand) => () => handlers.send(command)

  const menu = Menu.buildFromTemplate([
    {
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { label: 'Settings…', accelerator: 'CmdOrCtrl+,', click: send('toggle-settings') },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'File',
      submenu: [
        { label: 'New Window', accelerator: 'CmdOrCtrl+N', click: () => handlers.newWindow() },
        { label: 'Open…', accelerator: 'CmdOrCtrl+O', click: () => handlers.openDialog() },
        { type: 'separator' },
        { label: 'Save', accelerator: 'CmdOrCtrl+S', click: send('save') },
        { label: 'Save As…', accelerator: 'CmdOrCtrl+Shift+S', click: send('save-as') },
        { label: 'Reload from Disk', accelerator: 'CmdOrCtrl+R', click: send('reload-file') },
        { type: 'separator' },
        { label: 'Close Tab', accelerator: 'CmdOrCtrl+W', click: send('close-tab') },
        { role: 'close', accelerator: 'CmdOrCtrl+Shift+W' }
      ]
    },
    { role: 'editMenu' },
    {
      label: 'View',
      submenu: [
        { label: 'Toggle File Tree', accelerator: 'CmdOrCtrl+B', click: send('toggle-tree') },
        { label: 'Toggle Split Editor', accelerator: 'CmdOrCtrl+E', click: send('toggle-split') },
        { type: 'separator' },
        { label: 'Bigger Text', accelerator: 'CmdOrCtrl+Plus', click: send('zoom-in') },
        { label: 'Smaller Text', accelerator: 'CmdOrCtrl+-', click: send('zoom-out') },
        { label: 'Actual Size', accelerator: 'CmdOrCtrl+0', click: send('zoom-reset') },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        { role: 'toggleDevTools' }
      ]
    },
    {
      role: 'windowMenu',
      submenu: [
        { label: 'Show Next Tab', accelerator: 'Ctrl+Tab', click: send('next-tab') },
        { label: 'Show Previous Tab', accelerator: 'Ctrl+Shift+Tab', click: send('previous-tab') },
        { type: 'separator' },
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' }
      ]
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'vue-stream-markdown on GitHub',
          click: () => shell.openExternal('https://github.com/jinghaihan/vue-stream-markdown')
        }
      ]
    }
  ])

  Menu.setApplicationMenu(menu)
}
