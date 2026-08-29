import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { existsSync, readFileSync } from 'fs'
import { ServerManager } from './serverManager'
import * as store from './store'
import { setupUpdater } from './updater'
import type { PaintEntry, Player } from '../types'

let win: BrowserWindow | null = null
const server = new ServerManager()

function createWindow(): void {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (app.isPackaged) {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  } else {
    win.loadURL('http://localhost:5173')
  }

  setupUpdater(win)
}

function registerHandlers(): void {
  ipcMain.handle('load-settings', () => store.loadSettings())
  ipcMain.handle('save-settings', (_e, s) => {
    store.saveSettings(s)
    return true
  })
  ipcMain.handle('start-server', () => {
    const s = store.loadSettings()
    server.start({ serverPath: s.serverPath, port: s.port, gslt: s.gslt, serverExe: s.serverExe })
    return true
  })
  ipcMain.handle('stop-server', () => {
    server.stop()
    return true
  })
  ipcMain.handle('send-command', (_e, cmd: string) => {
    server.sendCommand(cmd)
    return true
  })
  ipcMain.handle('get-players', (): Player[] => server.getPlayers())
  ipcMain.handle('get-known-players', () => store.getKnownPlayers())
  ipcMain.handle('get-app-version', () => app.getVersion())
  ipcMain.handle('load-catalog', (_e, serverPath?: string): PaintEntry[] => {
    const rel = ['plugins', 'InventoryChanger', 'data', 'skins.json']
    const roots: string[] = []
    roots.push(join(app.getAppPath(), 'server'))
    roots.push(join(app.getAppPath(), '..', 'server'))
    if (process.resourcesPath) roots.push(join(process.resourcesPath, 'server'))
    const settings = store.loadSettings()
    if (settings.serverPath) roots.push(settings.serverPath)
    if (serverPath) roots.push(serverPath)
    for (const r of roots) {
      const file = join(r, ...rel)
      if (existsSync(file)) {
        return JSON.parse(readFileSync(file, 'utf8')) as PaintEntry[]
      }
    }
    throw new Error('Catalogo de skins nao encontrado (server/plugins/InventoryChanger/data/skins.json)')
  })
}

function wireServerEvents(): void {
  server.on('log', (line: string) => {
    win?.webContents.send('server-log', line)
  })
  server.on('status', (status) => {
    win?.webContents.send('server-status', status)
    if (status.players > 0) {
      store.rememberPlayers(server.getPlayers())
    }
  })
  server.on('connect', (p: Player) => {
    store.rememberPlayers([p])
  })
  server.on('error', (msg: string) => {
    win?.webContents.send('server-error', msg)
  })
}

app.whenReady().then(() => {
  createWindow()
  registerHandlers()
  wireServerEvents()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
