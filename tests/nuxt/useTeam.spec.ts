import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { effectScope } from "vue";

import { clearNuxtState } from "#imports";

const { navigateToMock } = vi.hoisted(() => ({ navigateToMock: vi.fn() }));
const fetchMock = vi.hoisted(() => vi.fn());

mockNuxtImport("navigateTo", () => navigateToMock);
mockNuxtImport("$fetch", () => fetchMock);

const mon = (name: string) => ({ name, types: ["Normal"], sprites: undefined });

const teamFull = () =>
  Object.assign(new Error("Team is full"), {
    statusCode: 400,
    data: { message: "Team is full" },
  });

type TeamApi = ReturnType<typeof useTeam>;

let scope: ReturnType<typeof effectScope> | undefined;
let resolveRed: ((value: unknown) => void) | undefined;

/**
 * `useTeam` registers a `watch` that is never disposed when called outside a
 * component. Each test gets its own scope so watchers from earlier tests cannot
 * refetch on the `clearNuxtState()` reset.
 */
function mountTeam(): TeamApi {
  let api!: TeamApi;
  scope = effectScope();
  scope.run(() => {
    api = useTeam();
  });
  return api;
}

beforeEach(() => {
  fetchMock.mockReset();
  navigateToMock.mockReset();
  clearNuxtState();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  scope?.stop();
  scope = undefined;
});

describe("useTeam hydration", () => {
  it("loads the active roster for the selected version on first use", async () => {
    fetchMock.mockResolvedValueOnce([mon("Pikachu")]);

    const { team } = mountTeam();

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith("/api/teams", { query: { version: "red" } });
    expect(team.value).toEqual([mon("Pikachu")]);
  });

  it("skips the initial fetch when the roster is already populated", () => {
    useState("team").value = [mon("Pikachu")];

    const { team } = mountTeam();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(team.value).toEqual([mon("Pikachu")]);
  });

  it("refetches for the newly selected version", async () => {
    fetchMock.mockResolvedValueOnce([mon("Pikachu")]);

    const { team, selectedVersion } = mountTeam();
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    fetchMock.mockResolvedValueOnce([mon("Charizard")]);
    selectedVersion.value = "scarlet";

    await vi.waitFor(() => expect(team.value).toEqual([mon("Charizard")]));
    expect(fetchMock).toHaveBeenLastCalledWith("/api/teams", { query: { version: "scarlet" } });
  });

  it("discards a response that arrives after the version changed", async () => {
    fetchMock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveRed = resolve;
        }),
    );

    const { team, selectedVersion } = mountTeam();
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    fetchMock.mockResolvedValueOnce([mon("Charizard")]);
    selectedVersion.value = "scarlet";
    await vi.waitFor(() => expect(team.value).toEqual([mon("Charizard")]));

    resolveRed?.([mon("Pikachu")]);
    await Promise.resolve();
    await Promise.resolve();

    expect(team.value).toEqual([mon("Charizard")]);
  });

  it("clears the roster when the session is unauthenticated", async () => {
    fetchMock.mockResolvedValueOnce([mon("Pikachu")]);
    const { team, refresh } = mountTeam();
    await vi.waitFor(() => expect(team.value).toHaveLength(1));

    fetchMock.mockRejectedValueOnce({ statusCode: 401 });
    await refresh();

    expect(team.value).toEqual([]);
  });

  it("keeps the roster when the server fails", async () => {
    fetchMock.mockResolvedValueOnce([mon("Pikachu")]);
    const { team, refresh } = mountTeam();
    await vi.waitFor(() => expect(team.value).toHaveLength(1));

    fetchMock.mockRejectedValueOnce({ statusCode: 500 });
    await refresh();

    expect(team.value).toEqual([mon("Pikachu")]);
  });
});

describe("useTeam addToTeam", () => {
  it("posts the pokemon for the selected version and refreshes", async () => {
    fetchMock.mockImplementation(async (_url, options?: { method?: string }) => {
      if (options?.method === "POST") return { success: true, title: "Added!" };
      return [mon("Pikachu")];
    });

    const { addToTeam, team } = mountTeam();
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled());

    const message = await addToTeam(mon("Pikachu"));

    expect(message).toEqual({ success: true, title: "Added!" });
    expect(fetchMock).toHaveBeenCalledWith("/api/teams", {
      method: "POST",
      body: { version: "red", pokemon: mon("Pikachu") },
    });
    expect(team.value).toEqual([mon("Pikachu")]);
    expect(navigateToMock).not.toHaveBeenCalled();
  });

  it("surfaces a full team without redirecting", async () => {
    fetchMock.mockResolvedValueOnce([]);
    const { addToTeam } = mountTeam();
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    fetchMock.mockRejectedValueOnce(teamFull());

    await expect(addToTeam(mon("Pikachu"))).resolves.toEqual({
      success: false,
      title: "Team is full",
    });
    expect(navigateToMock).not.toHaveBeenCalled();
  });

  it("surfaces a duplicate pokemon", async () => {
    fetchMock.mockResolvedValueOnce([]);
    const { addToTeam } = mountTeam();
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    fetchMock.mockRejectedValueOnce(
      Object.assign(new Error("Already on team!"), {
        statusCode: 400,
        data: { message: "Already on team!" },
      }),
    );

    await expect(addToTeam(mon("Pikachu"))).resolves.toEqual({
      success: false,
      title: "Already on team!",
    });
  });

  it("redirects to /login when unauthenticated", async () => {
    fetchMock.mockResolvedValueOnce([]);
    const { addToTeam } = mountTeam();
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    fetchMock.mockRejectedValueOnce({ statusCode: 401 });

    await expect(addToTeam(mon("Pikachu"))).resolves.toEqual({
      success: false,
      title: "Sign in to add to your team",
    });
    expect(navigateToMock).toHaveBeenCalledWith("/login");
  });

  it("replaces the raw ofetch message with a friendly one on 503", async () => {
    fetchMock.mockResolvedValueOnce([]);
    const { addToTeam } = mountTeam();
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    fetchMock.mockRejectedValueOnce({
      statusCode: 503,
      statusMessage: '[POST] "/api/teams": 503',
    });

    await expect(addToTeam(mon("Pikachu"))).resolves.toEqual({
      success: false,
      title: "Database unavailable",
    });
  });
});

describe("useTeam removeFromTeam", () => {
  it("deletes the encoded name for the selected version", async () => {
    fetchMock.mockResolvedValueOnce([mon("Mr. Mime")]);
    const { removeFromTeam, team } = mountTeam();
    await vi.waitFor(() => expect(team.value).toHaveLength(1));

    fetchMock.mockResolvedValueOnce([]);
    const remaining = await removeFromTeam("Mr. Mime");

    expect(fetchMock).toHaveBeenLastCalledWith("/api/teams/Mr.%20Mime", {
      method: "DELETE",
      query: { version: "red" },
    });
    expect(remaining).toEqual([]);
    expect(team.value).toEqual([]);
  });

  it("redirects and rethrows when unauthenticated", async () => {
    fetchMock.mockResolvedValueOnce([mon("Pikachu")]);
    const { removeFromTeam } = mountTeam();
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    fetchMock.mockRejectedValueOnce({ statusCode: 401 });

    await expect(removeFromTeam("Pikachu")).rejects.toMatchObject({ statusCode: 401 });
    expect(navigateToMock).toHaveBeenCalledWith("/login");
  });
});

describe("useTeam enshrineTeam", () => {
  it("posts title and notes, then refreshes", async () => {
    fetchMock.mockImplementation(async (_url, options?: { method?: string }) => {
      if (options?.method === "POST") {
        return { success: true, title: "Enshrined!", enshrinedId: 7 };
      }
      return [];
    });

    const { enshrineTeam, team } = mountTeam();
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const message = await enshrineTeam("Champion run", "No items");

    expect(message).toEqual({ success: true, title: "Enshrined!", enshrinedId: 7 });
    expect(fetchMock).toHaveBeenCalledWith("/api/teams/enshrine", {
      method: "POST",
      body: { version: "red", title: "Champion run", notes: "No items" },
    });
    expect(team.value).toEqual([]);
  });

  it("passes an empty-roster rejection through", async () => {
    fetchMock.mockResolvedValueOnce([]);
    const { enshrineTeam } = mountTeam();
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    fetchMock.mockRejectedValueOnce(
      Object.assign(new Error("Team is empty"), {
        statusCode: 400,
        data: { message: "Team is empty" },
      }),
    );

    await expect(enshrineTeam()).resolves.toEqual({ success: false, title: "Team is empty" });
  });

  it("redirects to /login when unauthenticated", async () => {
    fetchMock.mockResolvedValueOnce([]);
    const { enshrineTeam } = mountTeam();
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    fetchMock.mockRejectedValueOnce({ statusCode: 401 });

    await expect(enshrineTeam()).resolves.toEqual({
      success: false,
      title: "Sign in to enshrine your team",
    });
    expect(navigateToMock).toHaveBeenCalledWith("/login");
  });
});
