/**
 * PokeAPI endpoint configuration.
 *
 * The base URL and version are resolved from public runtime config so they can be
 * overridden per environment via `NUXT_PUBLIC_POKE_API_BASE_URL` and
 * `NUXT_PUBLIC_POKE_API_VERSION` without code changes (12-factor config).
 *
 * Must be called within a Nuxt context (component/composable/plugin), since
 * `useRuntimeConfig()` is only available there.
 */
export function getPokeApiEndpoints() {
  const { pokeApiBaseUrl, pokeApiVersion } = useRuntimeConfig().public;
  const base = `${pokeApiBaseUrl}/${pokeApiVersion}`;

  return {
    pokemon: `${base}/pokemon/`,
    type: `${base}/type/`,
  } as const;
}
