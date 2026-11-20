import type { Message } from "#shared/types/message";
import type { FormattedPokemon } from "#shared/types/pokemon";

export function usePokemonSearch() {
  const pokemonData = ref<FormattedPokemon | null>(null);
  const loading = ref(false);
  const message = ref<Message | null>(null);

  /** Returns true only when the search succeeded, so callers can clear the input. */
  async function search(query: string): Promise<boolean> {
    if (!query.trim()) return false;
    message.value = null;
    pokemonData.value = null;
    loading.value = true;
    try {
      pokemonData.value = await searchPokemon(query);
      message.value = {
        success: true,
        title: "Pokemon Found!",
      };
      return true;
    } catch (err) {
      message.value = {
        success: false,
        title: err instanceof Error ? err.message : "Error fetching data",
      };
      return false;
    } finally {
      loading.value = false;
    }
  }

  return { pokemonData, loading, message, search };
}
