// Atualiza o catalogo do FRAGHOST baixando as fontes oficiais e regerando
// server/plugins/InventoryChanger/data/skins.json.
//
//   - skins/gloves/agents: repositorio cs2-WeaponPaints (Nereziel)
//   - raridade por paintkit: ByMykel/CSGO-API (skins.json -> paint_index + rarity)
//
// Uso: node tools/update-catalog.js
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const srcDir = path.join(root, 'tools', 'catalog-source')

const SOURCES = {
  'skins_en.json': 'https://raw.githubusercontent.com/Nereziel/cs2-WeaponPaints/main/website/data/skins_en.json',
  'gloves_en.json': 'https://raw.githubusercontent.com/Nereziel/cs2-WeaponPaints/main/website/data/gloves_en.json',
  'agents_en.json': 'https://raw.githubusercontent.com/Nereziel/cs2-WeaponPaints/main/website/data/agents_en.json'
}

const RARITY_SOURCE = 'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json'

const { rarityFromId } = require('./rarity-map.js')

async function download(url, dest) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const text = await res.text()
  fs.writeFileSync(dest, text, 'utf8')
  console.log(`baixado: ${path.basename(dest)} (${text.length} bytes)`)
}

async function main() {
  fs.mkdirSync(srcDir, { recursive: true })

  for (const [file, url] of Object.entries(SOURCES)) {
    try {
      await download(url, path.join(srcDir, file))
    } catch (err) {
      console.warn(`[aviso] nao atualizei ${file}: ${err.message}`)
    }
  }

  const rarityPath = path.join(srcDir, 'rarity.json')
  try {
    const res = await fetch(RARITY_SOURCE)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const skins = await res.json()
    const out = {}
    for (const s of skins) {
      const pk = s.paint_index
      const r = rarityFromId(s.rarity && s.rarity.id)
      if (!pk || !r) continue
      out[pk] = r
    }
    fs.writeFileSync(rarityPath, JSON.stringify(out, null, 2), 'utf8')
    console.log(`raridade: ${Object.keys(out).length} paintkits mapeados`)
  } catch (err) {
    console.warn(`[aviso] nao atualizei rarity.json: ${err.message}`)
  }

  // gera skins.json a partir das fontes atualizadas
  require('./gen-catalog.js')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
