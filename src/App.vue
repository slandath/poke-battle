<script setup lang="ts">
import type { FormattedPokemon, Pokemon } from './types/pokemon'
import { ref } from 'vue'
import Footer from './components/Footer.vue'
import PokemonCard from './components/PokemonCard.vue'
import SearchForm from './components/SearchForm.vue'
import { formatPokemonData } from './utils/format'

const pokemonData = ref<FormattedPokemon | null>(null)
const loading = ref(false)
const error = ref('')
const url = 'https://pokeapi.co/api/v2/pokemon/'

async function handleSearch(query: string) {
  if (!query.trim())
    return
  error.value = ''
  loading.value = true

  try {
    const response = await fetch(
      url + query,
    )
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Pokemon not found')
      }
      else {
        throw new Error(`API Error: ${response.status}`)
      }
    }
    const data: Pokemon = await response.json()
    pokemonData.value = formatPokemonData(data)
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : 'Error fetching data'
    pokemonData.value = null
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <div class="text-center">
      <header class="bg-blue-500 p-4 text-gray-100 text-shadow-md">
        <h1 class="text-4xl">
          Pokemon Battle Tool
        </h1>
        <div class="my-4" />
        <p>
          Find your opponent's pokemon and view the best type match-ups.
        </p>
      </header>
    </div>
    <main class="flex-1 p-4">
      <SearchForm :loading="loading" @search="handleSearch" />
      <PokemonCard v-if="pokemonData || error" :data="pokemonData" :error="error" />
    </main>
    <Footer />
  </div>
</template>
