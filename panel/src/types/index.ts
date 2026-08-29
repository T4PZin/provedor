export interface Settings {
  serverPath: string
  serverExe?: string
  port: number
  gslt: string
  rconPassword?: string
  steamAccount?: string
}

export interface Player {
  steamId: string
  name: string
}

export interface KnownPlayer {
  steamId: string
  name: string
  lastSeen: string
}

export type PaintCategory = 'knife' | 'glove' | 'weapon' | 'agent'

export interface PaintEntry {
  id: string
  name: string
  rarity: string
  image: string
  category: PaintCategory
  weapon?: string
}

export interface ServerStatus {
  running: boolean
  players: number
  maxPlayers: number
  map?: string
}

export interface FraghostAPI {
  loadSettings(): Promise<Settings>
  saveSettings(s: Settings): Promise<void>
  startServer(): Promise<void>
  stopServer(): Promise<void>
  sendCommand(cmd: string): Promise<void>
  getPlayers(): Promise<Player[]>
  getKnownPlayers(): Promise<KnownPlayer[]>
  loadCatalog(serverPath?: string): Promise<PaintEntry[]>
  getAppVersion(): Promise<string>
  onServerLog(cb: (line: string) => void): () => void
  onServerStatus(cb: (status: ServerStatus) => void): () => void
  onServerError(cb: (msg: string) => void): () => void
}
