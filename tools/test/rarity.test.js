const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const fs = require('node:fs')

const { RARITY_MAP, rarityFromId } = require('../rarity-map.js')

test('rarityFromId mapeia todos os tiers do CS2', () => {
  const expected = {
    rarity_common_weapon: 'consumer',
    rarity_uncommon_weapon: 'industrial',
    rarity_rare_weapon: 'milspec',
    rarity_mythical_weapon: 'restricted',
    rarity_legendary_weapon: 'classified',
    rarity_ancient_weapon: 'covert',
    rarity_contraband_weapon: 'contraband',
    rarity_ancient: 'extraordinary'
  }
  for (const [id, key] of Object.entries(expected)) {
    assert.equal(rarityFromId(id), key)
  }
})

test('rarityFromId retorna vazio para id invalido/ausente', () => {
  assert.equal(rarityFromId(undefined), '')
  assert.equal(rarityFromId(''), '')
  assert.equal(rarityFromId('rarity_desconhecida'), '')
})

test('RARITY_MAP cobre todos os tiers usados por RARITY_COLORS', () => {
  const keys = Object.values(RARITY_MAP)
  for (const k of ['consumer', 'industrial', 'milspec', 'restricted', 'classified', 'covert', 'contraband', 'extraordinary']) {
    assert.ok(keys.includes(k), `falta mapeamento para ${k}`)
  }
})

test('raridade do catalogo bate com a fonte autoritativa (rarity.json)', () => {
  const catalogPath = path.join(__dirname, '..', '..', 'server', 'plugins', 'InventoryChanger', 'data', 'skins.json')
  const rarityPath = path.join(__dirname, '..', 'catalog-source', 'rarity.json')
  assert.ok(fs.existsSync(catalogPath), 'skins.json nao encontrado; rode tools/update-catalog.js')
  assert.ok(fs.existsSync(rarityPath), 'rarity.json nao encontrado; rode tools/update-catalog.js')
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'))
  const rarity = JSON.parse(fs.readFileSync(rarityPath, 'utf8'))

  let checked = 0
  for (const w of catalog.weapons) {
    for (const p of w.paints) {
      const expected = rarity[String(p.id)]
      if (expected) {
        assert.equal(p.rarity, expected, `raridade divergente p/ ${w.id} paint ${p.id}`)
        checked++
      }
    }
  }
  assert.ok(checked > 1000, `poucos paintkits conferidos contra a fonte: ${checked}`)

  // facas: raridade vem do ByMykel (mesmo mapa), luvas: extraordinary
  let knifeChecked = 0
  for (const k of catalog.knives) {
    for (const p of k.paints) {
      const expected = rarity[String(p.id)]
      if (expected) { assert.equal(p.rarity, expected, `raridade divergente p/ faca ${k.id} paint ${p.id}`); knifeChecked++ }
    }
  }
  assert.ok(knifeChecked > 100, `poucas facas conferidas: ${knifeChecked}`)

  for (const g of catalog.gloves) {
    for (const p of g.paints) assert.equal(p.rarity, 'extraordinary', `luva ${g.id} paint ${p.id}`)
  }

  // agentes: id/name/model presentes e team 2(TR)/3(CT)
  for (const a of catalog.agents) {
    assert.ok(a.id && a.name && a.model, `agente incompleto: ${JSON.stringify(a)}`)
    assert.ok([2, 3].includes(a.team), `agente team invalido: ${a.id}`)
  }
})
