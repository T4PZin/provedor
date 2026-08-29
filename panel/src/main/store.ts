import { app } from 'electron'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import type { KnownPlayer, Player, Settings } from '../types'

const DEFAULT_SETTINGS: Settings = {
  serverPath: '',
  port: 27015,
  gslt: ''
}

function settingsPath(): string {
  return join(app.getPath('userData'), 'settings.json')
}

function historyPath(): string {
  return join(app.getPath('userData'), 'players_history.json')
}

export function loadSettings(): Settings {
  try {
    if (!existsSync(settingsPath())) return { ...DEFAULT_SETTINGS }
    const raw = readFileSync(settingsPath(), 'utf8')
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(s: Settings): void {
  const dir = app.getPath('userData')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(settingsPath(), JSON.stringify(s, null, 2), 'utf8')
}

function readHistory(): Map<string, KnownPlayer> {
  const map = new Map<string, KnownPlayer>()
  try {
    if (!existsSync(historyPath())) return map
    const arr = JSON.parse(readFileSync(historyPath(), 'utf8')) as KnownPlayer[]
    for (const p of arr) map.set(p.steamId, p)
  } catch {
    // ignore corrupted history
  }
  return map
}

function writeHistory(map: Map<string, KnownPlayer>): void {
  const dir = app.getPath('userData')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(historyPath(), JSON.stringify(Array.from(map.values()), null, 2), 'utf8')
}

export function rememberPlayers(players: Player[]): void {
  if (!players.length) return
  const map = readHistory()
  const now = new Date().toISOString()
  for (const p of players) {
    map.set(p.steamId, { steamId: p.steamId, name: p.name, lastSeen: now })
  }
  writeHistory(map)
}

export function getKnownPlayers(): KnownPlayer[] {
  return Array.from(readHistory().values()).sort((a, b) => b.lastSeen.localeCompare(a.lastSeen))
}
