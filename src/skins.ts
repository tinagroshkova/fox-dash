export type Skin = 'classic' | 'ember' | 'frost' | 'gold'

export interface SkinDef {
  id: Skin
  name: string
  cost: number
}

export const SKINS: SkinDef[] = [
  { id: 'classic', name: 'Classic', cost: 0 },
  { id: 'ember', name: 'Ember', cost: 60 },
  { id: 'frost', name: 'Frost', cost: 180 },
  { id: 'gold', name: 'Golden', cost: 400 },
]

export const skinFor = (totalBerries: number): Skin => {
  let skin: Skin = 'classic'
  for (const def of SKINS) {
    if (totalBerries >= def.cost) {
      skin = def.id
    }
  }
  return skin
}

export const skinName = (skin: Skin): string =>
  SKINS.find((def) => def.id === skin)?.name ?? 'Classic'

export const nextSkin = (totalBerries: number): SkinDef | null =>
  SKINS.find((def) => def.cost > totalBerries) ?? null
