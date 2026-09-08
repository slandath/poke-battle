import type { Message } from "~/types/message";
import type { FormattedPokemon } from "~/types/pokemon";

const STORAGE_KEY = "pokemon-team";

// Legacy localStorage helpers (kept for fallback until auth/DB fully replaces)
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
  const team = useState<FormattedPokemon[]>("team", () => []);

  async function refresh() {
    if (!import.meta.client) return;
    try {
      const data = await $fetch<FormattedPokemon[]>("/api/teams");
      team.value = data;
    } catch (err: any) {
      // Fallback to localStorage if unauthenticated or DB not configured (dummy URL during lint/typecheck, or private DB without railway run)
      if (err?.statusCode === 401 || err?.status === 401) {
        const legacy = loadTeam();
        team.value = legacy;
        return;
      }
      // If fetch fails for other reason, keep legacy as fallback but log
      console.error(err);
      const legacy = loadTeam();
      if (legacy.length) team.value = legacy;
    }
  }

  // Initial load (client-only, ssr:false)
  if (import.meta.client) {
    // fire-and-forget; pages also call refresh on mount for HMR
    void refresh();
  }

  async function add(pokemon: FormattedPokemon): Promise<Message> {
    try {
      const res = await $fetch<{ success: boolean; title: string }>("/api/teams", {
        method: "POST",
        body: { pokemon },
      });
      await refresh();
      return res;
    } catch (err: any) {
      const msg = err?.data?.message || err?.statusMessage || err?.message;
      if (msg === "Team is full" || msg === "Already on team!") {
        return { success: false, title: msg };
      }
      // Fallback to legacy localStorage if server unavailable/unauthorized
      if (err?.statusCode === 401 || err?.status === 401 || !import.meta.client) {
        const legacy = addToTeam(pokemon);
        if (legacy.success) team.value = loadTeam();
        return legacy;
      }
      console.error(err);
      return { success: false, title: err instanceof Error ? err.message : "Error adding to team" };
    }
  }

  async function remove(name: string): Promise<FormattedPokemon[]> {
    try {
      const data = await $fetch<FormattedPokemon[]>(`/api/teams/${encodeURIComponent(name)}`, {
        method: "DELETE",
      });
      team.value = data;
      return data;
    } catch (err: any) {
      if (err?.statusCode === 401 || err?.status === 401) {
        const updated = removeFromTeam(name);
        team.value = updated;
        return updated;
      }
      console.error(err);
      const updated = removeFromTeam(name);
      team.value = updated;
      return updated;
    }
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
