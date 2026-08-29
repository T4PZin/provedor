import { describe, it, expect } from 'vitest'
import { parseLogLine } from './serverManager.parse'

describe('parseLogLine', () => {
  it('faz parse de connect com nome entre aspas', () => {
    const line = 'Connecting: "Player One" (steamid:76561198000000001) <>'
    const ev = parseLogLine(line)
    expect(ev.type).toBe('connect')
    if (ev.type === 'connect') {
      expect(ev.steamId).toBe('76561198000000001')
      expect(ev.name).toBe('Player One')
    }
  })

  it('trata sufixo "<>" vazio como time ausente', () => {
    const line = 'Connecting: John (steamid:76561198000000002) <>'
    const ev = parseLogLine(line)
    expect(ev.type).toBe('connect')
    if (ev.type === 'connect') {
      expect(ev.team).toBeUndefined()
      expect(ev.steamId).toBe('76561198000000002')
    }
  })

  it('captura steamId no grupo correto em disconnect', () => {
    const line = '"Player One" disconnected (steamid:76561198000000001)'
    const ev = parseLogLine(line)
    expect(ev.type).toBe('disconnect')
    if (ev.type === 'disconnect') {
      expect(ev.steamId).toBe('76561198000000001')
      expect(ev.name).toBe('Player One')
    }
  })

  it('faz parse de chat', () => {
    const line = '"Player One" (steamid:76561198000000001): ola mundo'
    const ev = parseLogLine(line)
    expect(ev.type).toBe('chat')
    if (ev.type === 'chat') {
      expect(ev.steamId).toBe('76561198000000001')
      expect(ev.message).toBe('ola mundo')
    }
  })

  it('faz parse de linha de status', () => {
    const line = '# 1 "Player One" steamid:76561198000000001'
    const ev = parseLogLine(line)
    expect(ev.type).toBe('status')
    if (ev.type === 'status') {
      expect(ev.players[0]).toEqual({ name: 'Player One', steamId: '76561198000000001' })
    }
  })

  it('retorna unknown para linhas irrelevantes', () => {
    const ev = parseLogLine('Initializing Steam libraries')
    expect(ev.type).toBe('unknown')
  })
})
