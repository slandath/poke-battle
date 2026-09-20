import type { Message } from "#shared/types/message";
import type { FormattedPokemon } from "#shared/types/pokemon";

export function usePokemonSearch() {
  const pokemonData = ref<FormattedPokemon | null>(null);
  const loading = ref(false);
  const message = ref<Message | null>(null);

  async function search(query: string) {
    if (!query.trim()) return;
    message.value = null;
    pokemonData.value = null;
    loading.value = true;
    try {
      pokemonData.value = await searchPokemon(query);
      message.value = {
        success: true,
        title: "Pokemon Found!",
      };
    } catch (err) {
      message.value = {
        success: false,
        title: err instanceof Error ? err.message : "Error fetching data",
      };
    } finally {
      loading.value = false;
    }
  }

  return { pokemonData, loading, message, search };
}
