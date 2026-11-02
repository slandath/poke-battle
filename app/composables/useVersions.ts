export const DEFAULT_GAME_VERSION = "red";

interface PokeApiVersionList {
  results: Array<{ name: string }>;
}

export function useVersions() {
  const selectedVersion = useState<string>("selected-version", () => DEFAULT_GAME_VERSION);
  const versions = useState<string[]>("game-versions", () => []);
  const pending = ref(false);

  async function loadVersions() {
    if (!import.meta.client || versions.value.length > 0 || pending.value) return;
    pending.value = true;
    try {
      const { pokeApiBaseUrl, pokeApiVersion } = useRuntimeConfig().public;
      const data = await $fetch<PokeApiVersionList>(
        `${pokeApiBaseUrl}/${pokeApiVersion}/version?limit=100`,
      );
      const names = (data.results ?? []).map((r) => r.name).filter(Boolean);
      if (names.length > 0) {
        versions.value = names;
        if (!names.includes(selectedVersion.value)) {
          selectedVersion.value = names.includes(DEFAULT_GAME_VERSION)
            ? DEFAULT_GAME_VERSION
            : names[0]!;
        }
      }
    } catch (err: unknown) {
      console.error(err);
    } finally {
      pending.value = false;
    }
  }

  if (import.meta.client) {
    void loadVersions();
  }

  function selectVersion(version: string) {
    selectedVersion.value = version;
  }

  return { versions, selectedVersion, selectVersion, loadVersions };
}
