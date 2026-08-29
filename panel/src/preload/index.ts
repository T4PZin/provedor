import { contextBridge, ipcRenderer } from 'electron'
import type { FraghostAPI, ServerStatus } from '../types'

const api: FraghostAPI = {
  loadSettings: () => ipcRenderer.invoke('load-settings'),
  saveSettings: (s) => ipcRenderer.invoke('save-settings', s),
  startServer: () => ipcRenderer.invoke('start-server'),
  stopServer: () => ipcRenderer.invoke('stop-server'),
  sendCommand: (cmd) => ipcRenderer.invoke('send-command', cmd),
  getPlayers: () => ipcRenderer.invoke('get-players'),
  getKnownPlayers: () => ipcRenderer.invoke('get-known-players'),
  loadCatalog: (serverPath) => ipcRenderer.invoke('load-catalog', serverPath),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  onServerLog: (cb) => {
    const listener = (_e: unknown, line: string) => cb(line)
    ipcRenderer.on('server-log', listener)
    return () => ipcRenderer.removeListener('server-log', listener)
  },
  onServerStatus: (cb) => {
    const listener = (_e: unknown, status: ServerStatus) => cb(status)
    ipcRenderer.on('server-status', listener)
    return () => ipcRenderer.removeListener('server-status', listener)
  },
  onServerError: (cb) => {
    const listener = (_e: unknown, msg: string) => cb(msg)
    ipcRenderer.on('server-error', listener)
    return () => ipcRenderer.removeListener('server-error', listener)
  }
}

contextBridge.exposeInMainWorld('fraghost', api)
