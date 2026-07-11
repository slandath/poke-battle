<script setup lang="ts">
import type { FormattedPokemon } from '../types/pokemon'
import { ref } from 'vue'
import { PokemonCard, SearchForm } from '@/components'
import { Button } from '@/components/ui/button'
import { addToTeam } from '@/utils/team'
import { searchPokemon } from '../utils/api'

const pokemonData = ref<FormattedPokemon | null>(null)
const loading = ref(false)
const message = ref('')

async function handleSearch(query: string) {
  if (!query.trim())
    return
  message.value = ''
  loading.value = true
  try {
    pokemonData.value = await searchPokemon(query)
  }
  catch (err) {
    message.value = err instanceof Error ? err.message : 'Error fetching data'
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
      v-if="pokemonData || message"
      :data="pokemonData"
      :error="message"
    />
    <div class="flex justify-center mt-4">
      <Button v-if="pokemonData" class="hover:cursor-pointer" @click="addToTeam(pokemonData)">
        Add to Team
      </Button>
    </div>
  </main>
</template>
