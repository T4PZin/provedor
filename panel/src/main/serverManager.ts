import { ChildProcessWithoutNullStreams, spawn } from 'child_process'
import { EventEmitter } from 'events'
import { existsSync } from 'fs'
import { dirname, join } from 'path'
import { parseLogLine } from './serverManager.parse'
import type { Player, ServerStatus } from '../types'

export interface StartOptions {
  serverPath: string
  serverExe?: string
  port: number
  gslt: string
}

export class ServerManager extends EventEmitter {
  private proc: ChildProcessWithoutNullStreams | null = null
  private players = new Map<string, Player>()
  private map = ''
  private maxPlayers = 0

  get running(): boolean {
    return this.proc !== null
  }

  start(opts: StartOptions): void {
    if (this.proc) return
    const exe = this.resolveExe(opts)
    if (!exe) {
      this.emit(
        'error',
        `Executavel do servidor nao encontrado em "${opts.serverPath}". ` +
          `Verifique o caminho nas Configuracoes e se o servidor dedicado esta instalado/extraido.`
      )
      this.emitStatus()
      return
    }

    const args = ['-dedicated', '-port', String(opts.port), '-console']
    if (opts.gslt) args.push('+sv_setsteamaccount', opts.gslt)
    args.push('+map', 'de_dust2')
    this.proc = spawn(exe, args, { cwd: dirname(exe) })

    this.proc.on('error', (e: Error) => {
      this.proc = null
      this.emit('error', `Falha ao iniciar o servidor: ${e.message}`)
      this.emitStatus()
    })

    const onData = (buf: Buffer) => this.ingest(buf.toString('utf8'))
    this.proc.stdout?.on('data', onData)
    this.proc.stderr?.on('data', onData)
    this.proc.on('exit', () => {
      this.proc = null
      this.players.clear()
      this.emit('serverStop')
      this.emitStatus()
    })

    this.emit('serverStart')
    this.emitStatus()
  }

  private resolveExe(opts: StartOptions): string | null {
    const candidates: string[] = []
    if (opts.serverExe && opts.serverExe.trim()) candidates.push(opts.serverExe.trim())
    const base = opts.serverPath || ''
    candidates.push(
      join(base, 'cs2.exe'),
      join(base, 'srcds.exe'),
      join(base, 'game', 'bin', 'win64', 'cs2.exe'),
      join(base, 'game', 'bin', 'win64', 'srcds.exe'),
      join(base, 'cs2-dedicated', 'game', 'bin', 'win64', 'cs2.exe'),
      join(base, 'cs2-dedicated', 'game', 'bin', 'win64', 'srcds.exe')
    )
    for (const c of candidates) {
      if (c && existsSync(c)) return c
    }
    return null
  }

  stop(): void {
    if (!this.proc) return
    this.proc.kill('SIGINT')
  }

  sendCommand(cmd: string): void {
    this.proc?.stdin.write(cmd + '\n')
  }

  getPlayers(): Player[] {
    return Array.from(this.players.values())
  }

  private ingest(text: string): void {
    const lines = text.split(/\r?\n/)
    for (const line of lines) {
      if (!line.trim()) continue
      if (line.includes('CTextConsoleWin::GetLine')) continue
      this.emit('log', line)
      const ev = parseLogLine(line)
      switch (ev.type) {
        case 'connect':
          this.players.set(ev.steamId, { steamId: ev.steamId, name: ev.name })
          this.emit('connect', { steamId: ev.steamId, name: ev.name })
          break
        case 'disconnect':
          this.players.delete(ev.steamId)
          this.emit('disconnect', { steamId: ev.steamId })
          break
        case 'status':
          for (const p of ev.players) this.players.set(p.steamId, p)
          break
        default:
          break
      }
    }
    this.emitStatus()
  }

  private emitStatus(): void {
    const status: ServerStatus = {
      running: this.running,
      players: this.players.size,
      maxPlayers: this.maxPlayers,
      map: this.map || undefined
    }
    this.emit('status', status)
  }
}
