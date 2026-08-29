export type LogEvent =
  | { type: 'connect'; steamId: string; name: string; team?: string }
  | { type: 'disconnect'; steamId: string; name?: string }
  | { type: 'chat'; steamId: string; name: string; message: string }
  | { type: 'status'; players: { steamId: string; name: string }[] }
  | { type: 'serverStart' }
  | { type: 'serverStop' }
  | { type: 'unknown'; line: string }

/**
 * Faz o parse de uma linha de log do console do CS2.
 * Suporta nomes entre aspas, sufixo "<>" (time vazio) e captura o steamId
 * no grupo correto em linhas de disconnect. O caso de disconnect é avaliado
 * antes de connect pois "disconnected" contem a substring "connected".
 */
export function parseLogLine(raw: string): LogEvent {
  const line = raw.trim()
  if (!line) return { type: 'unknown', line }

  // Disconnect (avaliado antes de connect): "Name" disconnected (steamid:ID)
  let m = line.match(/(?:"([^"]+)"|([^()]+?))\s+disconnected\s+\(steamid:(\d+)\)/i)
  if (m) {
    const name = (m[1] ?? m[2] ?? '').trim()
    return { type: 'disconnect', steamId: m[3], name: name || undefined }
  }

  // Connect / entering game  ->  "Keyword: Name (steamid:ID) <>"
  m = line.match(
    /(?:Connecting|connected|entering game)\s*:\s*(?:"([^"]+)"|([^()<]+?))\s*(?:<(\d+)>)?\s*\(steamid:(\d+)\)/i
  )
  if (m) {
    return {
      type: 'connect',
      name: (m[1] ?? m[2] ?? '').trim(),
      team: m[3],
      steamId: m[4]
    }
  }

  // Chat: Name (steamid:ID): message
  m = line.match(/(?:"([^"]+)"|([^()]+?))\s*\(steamid:(\d+)\)\s*:\s*(.+)/i)
  if (m) {
    return {
      type: 'chat',
      name: (m[1] ?? m[2] ?? '').trim(),
      steamId: m[3],
      message: m[4].trim()
    }
  }

  // Status block: # 1 "Name" steamid:7656...
  m = line.match(/^#\s*\d+\s+"(.*?)"\s+steamid:(\d+)/i)
  if (m) {
    return { type: 'status', players: [{ name: m[1].trim(), steamId: m[2] }] }
  }

  return { type: 'unknown', line }
}
