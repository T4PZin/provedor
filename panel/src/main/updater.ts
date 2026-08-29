import { app, BrowserWindow } from 'electron'
import { autoUpdater } from 'electron-updater'

export function setupUpdater(win: BrowserWindow): void {
  if (!app.isPackaged) return

  autoUpdater.autoDownload = true

  autoUpdater.on('update-available', () => {
    win.webContents.send('update-available')
  })

  autoUpdater.on('update-downloaded', () => {
    win.webContents.send('update-downloaded')
  })

  autoUpdater.on('error', (_e, message) => {
    win.webContents.send('update-error', message)
  })

  autoUpdater.checkForUpdatesAndNotify().catch(() => {
    // ignore: sem rede ou repo sem releases
  })
}
