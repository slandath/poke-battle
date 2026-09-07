import type { Message } from "~/types/message";
import type { FormattedPokemon } from "~/types/pokemon";

const STORAGE_KEY = "pokemon-team";

export function loadTeam(): FormattedPokemon[] {
  if (!import.meta.client) return [];
  const data = localStorage.getItem(STORAGE_KEY);
  if (data === null) return [];
  try {
    const parsedData = JSON.parse(data);
    if (Array.isArray(parsedData)) return parsedData;
    return [];
  } catch (err) {
    if (err instanceof Error) console.error(err);
    return [];
  }
}

export function saveTeam(team: FormattedPokemon[]): boolean {
  if (!import.meta.client) return false;
  const json = JSON.stringify(team);
  try {
    localStorage.setItem(STORAGE_KEY, json);
    return true;
  } catch (err) {
    if (err instanceof Error) console.error(err);
    return false;
  }
}

export function addToTeam(pokemon: FormattedPokemon): Message {
  const team = loadTeam();
  const result: Message = { success: false, title: "" };
  if (team.length >= 6) {
    result.title = "Team is full";
    return result;
  }
  if (team.some((p) => p.name === pokemon.name)) {
    result.title = "Already on team!";
    return result;
  }
  try {
    team.push(pokemon);
    if (saveTeam(team)) {
      result.success = true;
      result.title = "Added!";
    } else {
      result.title = "Failed to save team";
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(message);
    result.title = message;
  }
  return result;
}

export function removeFromTeam(name: string): FormattedPokemon[] {
  const team = loadTeam();
  const updated = team.filter((p) => p.name !== name);
  const saved = saveTeam(updated);
  if (!saved) console.error("Failed to persist team removal");
  return updated;
}

export function useTeam() {
  const team = useState<FormattedPokemon[]>("team", () => {
    if (import.meta.client) return loadTeam();
    return [];
  });

  // sync on client mount if state was empty but storage has data (SSR false so still needed for HMR)
  if (import.meta.client) {
    const stored = loadTeam();
    if (stored.length && team.value.length === 0) {
      team.value = stored;
    }
  }

  function add(pokemon: FormattedPokemon): Message {
    const result = addToTeam(pokemon);
    if (result.success) {
      team.value = loadTeam();
    }
    return result;
  }

  function remove(name: string) {
    const updated = removeFromTeam(name);
    team.value = updated;
    return updated;
  }

  function refresh() {
    team.value = loadTeam();
  }

  return {
    team,
    loadTeam,
    saveTeam,
    addToTeam: add,
    removeFromTeam: remove,
    refresh,
  };
}
