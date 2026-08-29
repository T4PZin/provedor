// Gera server/plugins/InventoryChanger/data/skins.json a partir das fontes
// baixadas em tools/catalog-source (cs2-WeaponPaints + ByMykel/CSGO-API).
//
// Saida: array de PaintEntry compativel com o painel:
//   { id, name, rarity, image, category, weapon }
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const srcDir = path.join(root, 'tools', 'catalog-source')
const outFile = path.join(
  root,
  'server',
  'plugins',
  'InventoryChanger',
  'data',
  'skins.json'
)

function readJson(name) {
  const p = path.join(srcDir, name)
  if (!fs.existsSync(p)) return null
  return JSON.parse(fs.readFileSync(p, 'utf8'))
}

function categoryFromWeaponName(name) {
  if (!name) return 'weapon'
  if (name.includes('knife')) return 'knife'
  if (name.includes('glove')) return 'glove'
  return 'weapon'
}

function build() {
  const rarity = readJson('rarity.json') || {}
  const skins = readJson('skins_en.json') || []
  const gloves = readJson('gloves_en.json') || []
  const agents = readJson('agents_en.json') || []

  const out = []

  for (const s of skins) {
    const paint = String(s.paint)
    out.push({
      id: `${s.weapon_name}-${paint}`,
      name: s.paint_name || s.weapon_name,
      rarity: s.rarity || rarity[paint] || 'unknown',
      image: s.image || '',
      category: categoryFromWeaponName(s.weapon_name),
      weapon: s.weapon_name
    })
  }

  for (const g of gloves) {
    const paint = String(g.paint)
    out.push({
      id: `${g.weapon_name || 'glove'}-${paint}`,
      name: g.paint_name || 'Glove',
      rarity: g.rarity || rarity[paint] || 'unknown',
      image: g.image || '',
      category: 'glove',
      weapon: g.weapon_name || 'glove'
    })
  }

  for (const a of agents) {
    if (!a.model || a.model === 'null') continue
    out.push({
      id: `agent-${a.model}`,
      name: a.agent_name || 'Agent',
      rarity: 'unknown',
      image: a.image || '',
      category: 'agent',
      weapon: a.model
    })
  }

  fs.mkdirSync(path.dirname(outFile), { recursive: true })
  fs.writeFileSync(outFile, JSON.stringify(out, null, 2), 'utf8')
  console.log(`gerado: ${path.relative(root, outFile)} (${out.length} itens)`)
}

build()
