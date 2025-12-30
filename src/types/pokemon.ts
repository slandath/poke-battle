export interface Pokemon {
  name: string
  types: Array<{
    slot: number
    type: {
      name: string
      url: string
    }
  }>
  sprites: Sprites
}

export interface Sprites {
  back_default: string | null
  back_female: string | null
  front_default: string | null
  front_shiny: string | null
  other: Record<string, Record<string, string | null>>
}

export interface FormattedPokemon {
  name: string
  types: string[]
  sprites: string | undefined
}
