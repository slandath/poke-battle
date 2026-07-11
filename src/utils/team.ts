import type { FormattedPokemon } from '@/types/pokemon'
import type { AddToTeamResult } from '@/types/team'

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

export function addToTeam(pokemon: FormattedPokemon): AddToTeamResult {
  const team = loadTeam()
  const result: AddToTeamResult = { success: false, message: '' }
  if (team.length >= 6) {
    result.message = 'Team is full'
    return result
  }
  if (team.some(p => p.name === pokemon.name)) {
    result.message = 'Already on team!'
    return result
  }
  try {
    team.push(pokemon)
    saveTeam(team)
    if (saveTeam(team)) {
      result.success = true
      result.message = 'Added!'
    }
    else {
      result.message = 'Failed to save team'
    }
  }
  catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(message)
    result.message = message
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
