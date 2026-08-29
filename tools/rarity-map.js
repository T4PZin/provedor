// Mapeamento de raridade do CS2 (paint_kits) para as chaves usadas em
// RARITY_COLORS (panel/src/renderer/src/api.ts).
//
// Fontes:
//   - raridade por paintkit: ByMykel/CSGO-API (skins.json -> paint_index + rarity.id)
//   - facas/luvas: sempre "extraordinary" (definido no gen-catalog.js)
const RARITY_MAP = {
  rarity_common_weapon: 'consumer',
  rarity_uncommon_weapon: 'industrial',
  rarity_rare_weapon: 'milspec',
  rarity_mythical_weapon: 'restricted',
  rarity_legendary_weapon: 'classified',
  rarity_ancient_weapon: 'covert',
  rarity_contraband_weapon: 'contraband',
  rarity_ancient: 'extraordinary'
}

function rarityFromId(rarityId) {
  return (rarityId && RARITY_MAP[rarityId]) || ''
}

module.exports = { RARITY_MAP, rarityFromId }
