<script setup lang="ts">
import { Check, LoaderCircle, Plus } from "lucide-vue-next";

import type { Message } from "~/types/message";
import type { FormattedPokemon } from "~/types/pokemon";

useHead({ title: "Search - Pokemon Tools" });

type ButtonState = "default" | "loading" | "success";

let stateTimer: ReturnType<typeof setTimeout> | null = null;
onUnmounted(() => {
  if (stateTimer) clearTimeout(stateTimer);
});

const pokemonData = ref<FormattedPokemon | null>(null);
const loading = ref(false);
const message = ref<Message | null>(null);
const buttonState = ref<ButtonState>("default");
const { addToTeam } = useTeam();

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

function handleAddToTeam() {
  if (!pokemonData.value || buttonState.value !== "default") return;
  buttonState.value = "loading";
  stateTimer = setTimeout(async () => {
    if (!pokemonData.value) return;
    const result = await addToTeam(pokemonData.value);
    message.value = {
      success: result.success,
      title: result.title,
    };
    if (result.success) {
      buttonState.value = "success";
      stateTimer = setTimeout(() => {
        buttonState.value = "default";
      }, 2000);
    } else {
      buttonState.value = "default";
    }
  }, 400);
}
</script>

<template>
  <div class="bg-white">
    <h1 class="p-2 text-3xl">Search</h1>
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
      <PokemonCard v-if="pokemonData || message" :data="pokemonData" />
      <div class="mt-4 flex justify-center">
        <Button
          v-if="pokemonData && message?.success"
          class="hover:cursor-pointer"
          :class="[
            buttonState === 'loading' && 'cursor-not-allowed bg-gray-400',
            buttonState === 'success' && 'bg-green-600 text-white',
            buttonState === 'default' && 'bg-blue-500',
          ]"
          :disabled="buttonState === 'loading'"
          @click="handleAddToTeam"
        >
          <LoaderCircle v-if="buttonState === 'loading'" class="size-4 animate-spin" />
          <Check v-else-if="buttonState === 'success'" class="size-4" />
          <Plus v-else class="size-4" />
        </Button>
      </div>
    </main>
  </div>
</template>
