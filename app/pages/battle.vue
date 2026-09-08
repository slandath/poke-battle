<script setup lang="ts">
import type { Message } from "~/types/message";
import type { FormattedPokemon } from "~/types/pokemon";

useHead({ title: "Battle - Pokemon Tools" });

const pokemonData = ref<FormattedPokemon | null>(null);
const loading = ref(false);
const message = ref<Message | null>(null);
const { team } = useTeam();

onMounted(() => {
  // refresh from storage on mount (handles direct nav)
  const { refresh } = useTeam();
  refresh();
});

async function handleSearch(query: string) {
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
</script>

<template>
  <div class="bg-white">
    <h1 class="p-2 text-3xl">Battle</h1>
    <main class="flex-1 p-4">
      <SearchForm :loading="loading" @search="handleSearch" />
      <div class="mt-4 flex justify-center">
        <MessageWrapper
          v-if="message && !message.success"
          :message="message"
          variant="destructive"
          show-description
          class="w-sm bg-red-200"
        />
      </div>
      <PokemonCard v-if="pokemonData" :data="pokemonData" />
      <div class="mx-auto mt-4 w-full max-w-xs">
        <Table>
          <TableCaption>Your Team ({{ team.length }}/6)</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead> Name </TableHead>
              <TableHead> Type(s) </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="pokemon in team" :key="pokemon.name">
              <TableCell>{{ pokemon.name }}</TableCell>
              <TableCell>{{ pokemon.types.join(", ") }}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </main>
  </div>
</template>
