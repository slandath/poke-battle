<script setup lang="ts">
import type { FormattedPokemon, Pokemon } from './types/pokemon'
import { ref } from 'vue'
import Footer from './components/Footer.vue'
import Header from './components/Header.vue'
import PokemonCard from './components/PokemonCard.vue'
import SearchForm from './components/SearchForm.vue'
import { fetchDamageRelations, formatPokemonData } from './utils/format'

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
    const response = await fetch(url + query)
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Pokemon not found')
      }
      else {
        throw new Error(`API Error: ${response.status}`)
      }
    }
    const data: Pokemon = await response.json()
    const damageRelations = await fetchDamageRelations(data.types)
    pokemonData.value = formatPokemonData(data)
    pokemonData.value.damageRelations = damageRelations
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
  <div class="flex min-h-screen flex-col">
    <Header />
    <main class="flex-1 p-4">
      <SearchForm :loading="loading" @search="handleSearch" />
      <PokemonCard
        v-if="pokemonData || error"
        :data="pokemonData"
        :error="error"
      />
    </main>
    <Footer />
  </div>
</template>
