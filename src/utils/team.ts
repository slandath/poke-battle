import type { Message } from '@/types/message'
import type { FormattedPokemon } from '@/types/pokemon'

const STORAGE_KEY = 'pokemon-team'

export function loadTeam(): FormattedPokemon[] {
  const data = localStorage.getItem(STORAGE_KEY)
  if (data === null)
    return []
  try {
    const parsedData = JSON.parse(data)
    if (Array.isArray(parsedData))
      return parsedData
    return []
  }
  catch (err) {
    if (err instanceof Error)
      console.error(err)
    return []
  }
}

export function saveTeam(team: FormattedPokemon[]): boolean {
  const json = JSON.stringify(team)
  try {
    localStorage.setItem(STORAGE_KEY, json)
    return true
  }
  catch (err) {
    if (err instanceof Error)
      console.error(err)
    return false
  }
}

export function addToTeam(pokemon: FormattedPokemon): Message {
  const team = loadTeam()
  const result: Message = { success: false, title: '' }
  if (team.length >= 6) {
    result.title = 'Team is full'
    return result
  }
  if (team.some(p => p.name === pokemon.name)) {
    result.title = 'Already on team!'
    return result
  }
  try {
    team.push(pokemon)
    saveTeam(team)
    if (saveTeam(team)) {
      result.success = true
      result.title = 'Added!'
    }
    else {
      result.title = 'Failed to save team'
    }
  }
  catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(message)
    result.title = message
  }
  return result
}

export function removeFromTeam(name: string): FormattedPokemon[] {
  const team = loadTeam()
  const updated = team.filter(p => p.name !== name)
  const saved = saveTeam(updated)
  if (!saved)
    console.error('Failed to persist team removal')
  return updated
}
