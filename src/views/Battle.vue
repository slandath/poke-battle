<script setup lang="ts">
import type { FormattedPokemon } from '../types/pokemon'
import { ref } from 'vue'
import { PokemonCard, SearchForm } from '@/components'
import { searchPokemon } from '../utils/api'

const pokemonData = ref<FormattedPokemon | null>(null)
const loading = ref(false)
const error = ref('')

async function handleSearch(query: string) {
  if (!query.trim())
    return
  error.value = ''
  loading.value = true
  try {
    pokemonData.value = await searchPokemon(query)
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : 'Error fetching data'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <h1 class="text-3xl p-2">
    Battle Tool
  </h1>
  <main class="flex-1 p-4">
    <SearchForm :loading="loading" @search="handleSearch" />
    <PokemonCard
      v-if="pokemonData || error"
      :data="pokemonData"
      :error="error"
    />
  </main>
</template>
