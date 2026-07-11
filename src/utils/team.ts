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

export function saveTeam(team: FormattedPokemon[]): void {
  const json = JSON.stringify(team)
  try {
    localStorage.setItem(STORAGE_KEY, json)
  }
  catch (err) {
    if (err instanceof Error)
      console.error(err)
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
    result.success = true
    result.message = 'Added!'
  }
  catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(message)
    result.message = message
  }
  return result
}
