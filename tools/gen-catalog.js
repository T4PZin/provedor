// Converte os dados oficiais do cs2-WeaponPaints (tools/catalog-source/*.json)
// para o formato do catalogo do FRAGHOST (server/plugins/InventoryChanger/data/skins.json).
// Uso: node tools/gen-catalog.js

const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const src = (f) => JSON.parse(fs.readFileSync(path.join(root, 'tools', 'catalog-source', f), 'utf8'))

const KNIFE_NAMES = {
  500: 'Bayonet', 503: 'Classic Knife', 505: 'Flip Knife', 506: 'Gut Knife',
  507: 'Karambit', 508: 'M9 Bayonet', 509: 'Huntsman Knife', 512: 'Falchion Knife',
  514: 'Bowie Knife', 515: 'Butterfly Knife', 516: 'Shadow Daggers', 517: 'Paracord Knife',
  518: 'Survival Knife', 519: 'Ursus Knife', 520: 'Navaja Knife', 521: 'Nomad Knife',
  522: 'Stiletto Knife', 523: 'Talon Knife', 525: 'Skeleton Knife', 526: 'Kukri Knife'
}

const clean = (name) => name.replace(/^★\s*/, '').trim()
const paintOf = (full) => clean(full.split('|')[1] ?? full)
const weaponNameOf = (full) => clean(full.split('|')[0] ?? full)

// Override de raridade por paintkit (opcional): tools/catalog-source/rarity.json
// mapeia "paintKit": "rarity". Facas e luvas ja sao always alta raridade.
// Raridades validas: consumer, industrial, milspec, restricted, classified,
// covert, contraband, extraordinary (veja panel/src/renderer/src/api.ts).
let rarityOverride = {}
try {
  rarityOverride = JSON.parse(fs.readFileSync(path.join(root, 'tools', 'catalog-source', 'rarity.json'), 'utf8'))
} catch { /* sem override */ }

const makePaint = (id, name, rarity, image) => ({ id, name, rarity: rarity || rarityOverride[id] || '', image: image || '' })

const skins = src('skins_en.json')
const gloves = src('gloves_en.json')
const agents = src('agents_en.json')

const weapons = new Map()
const knives = new Map()

for (const entry of skins) {
  const paint = Number(entry.paint)
  if (!paint) continue // pula "Default"

  const isKnife = KNIFE_NAMES[entry.weapon_defindex] !== undefined
  const bucket = isKnife ? knives : weapons
  if (!bucket.has(entry.weapon_name)) {
    bucket.set(entry.weapon_name, {
      id: entry.weapon_name,
      name: weaponNameOf(entry.paint_name),
      defIndex: entry.weapon_defindex,
      paints: []
    })
  }
  bucket.get(entry.weapon_name).paints.push(makePaint(paint, paintOf(entry.paint_name), undefined, entry.image))
}

const gloveGroups = new Map()
for (const entry of gloves) {
  const paint = Number(entry.paint)
  const def = Number(entry.weapon_defindex)
  if (!paint || !def) continue
  if (!gloveGroups.has(def)) {
    gloveGroups.set(def, { id: `glove_${def}`, name: weaponNameOf(entry.paint_name), defIndex: def, paints: [] })
  }
  gloveGroups.get(def).paints.push(makePaint(paint, paintOf(entry.paint_name), 'extraordinary', entry.image))
}

const agentList = agents
  .filter((a) => a.model && a.model !== 'null')
  .map((a) => ({
    id: a.model.replace('/', '_'),
    name: a.agent_name,
    model: a.model,
    team: a.team // 2 = TR, 3 = CT
  }))

const catalog = {
  weapons: [...weapons.values()].sort((a, b) => a.name.localeCompare(b.name)),
  knives: [...knives.values()].sort((a, b) => a.name.localeCompare(b.name)),
  gloves: [...gloveGroups.values()].sort((a, b) => a.name.localeCompare(b.name)),
  agents: agentList.sort((a, b) => a.name.localeCompare(b.name))
}

const out = path.join(root, 'server', 'plugins', 'InventoryChanger', 'data', 'skins.json')
fs.writeFileSync(out, JSON.stringify(catalog, null, 2), 'utf8')

console.log(`armas: ${catalog.weapons.length} (${catalog.weapons.reduce((n, w) => n + w.paints.length, 0)} skins)`)
console.log(`facas: ${catalog.knives.length} (${catalog.knives.reduce((n, w) => n + w.paints.length, 0)} skins)`)
console.log(`luvas: ${catalog.gloves.length} (${catalog.gloves.reduce((n, w) => n + w.paints.length, 0)} skins)`)
console.log(`agentes: ${catalog.agents.length}`)
console.log(`gravado em ${out}`)
