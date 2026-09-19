import type { Message } from "#shared/types/message";
import type { FormattedPokemon } from "#shared/types/pokemon";

function httpStatus(err: unknown): number | undefined {
  if (typeof err !== "object" || err === null) return undefined;
  if ("statusCode" in err && typeof err.statusCode === "number") return err.statusCode;
  if ("status" in err && typeof err.status === "number") return err.status;
  return undefined;
}

function httpMessage(err: unknown): string | undefined {
  if (typeof err !== "object" || err === null) return undefined;
  if (
    "data" in err &&
    typeof err.data === "object" &&
    err.data !== null &&
    "message" in err.data &&
    typeof err.data.message === "string"
  ) {
    return err.data.message;
  }
  if ("statusMessage" in err && typeof err.statusMessage === "string") return err.statusMessage;
  return undefined;
}

function apiMessage(err: unknown, fallback: string): string {
  const msg = httpMessage(err);
  if (msg && !/^\[(GET|POST|PUT|PATCH|DELETE)\] /.test(msg)) return msg;
  const status = httpStatus(err);
  if (status === 401) return "Sign in to manage your team";
  if (status === 503) return "Database unavailable";
  return fallback;
}

export function useTeam() {
  const team = useState<FormattedPokemon[]>("team", () => []);

  async function refresh() {
    if (!import.meta.client) return;
    try {
      const data = await $fetch<FormattedPokemon[]>("/api/teams");
      team.value = data;
    } catch (err: unknown) {
      if (httpStatus(err) === 401) {
        team.value = [];
        return;
      }
      console.error(err);
    }
  }

  if (import.meta.client) {
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
    } catch (err: unknown) {
      const msg = httpMessage(err);
      if (msg === "Team is full" || msg === "Already on team!") {
        return { success: false, title: msg };
      }
      if (httpStatus(err) === 401) {
        await navigateTo("/login");
        return { success: false, title: "Sign in to add to your team" };
      }
      console.error(err);
      return { success: false, title: apiMessage(err, "Error adding to team") };
    }
  }

  async function remove(name: string): Promise<FormattedPokemon[]> {
    try {
      const data = await $fetch<FormattedPokemon[]>(`/api/teams/${encodeURIComponent(name)}`, {
        method: "DELETE",
      });
      team.value = data;
      return data;
    } catch (err: unknown) {
      if (httpStatus(err) === 401) {
        await navigateTo("/login");
      }
      console.error(err);
      throw err;
    }
  }

  return {
    team,
    addToTeam: add,
    removeFromTeam: remove,
    refresh,
  };
}
