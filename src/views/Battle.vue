<script setup lang="ts">
import type { FormattedPokemon } from '../types/pokemon'
import type { Message } from '@/types/message'
import { onMounted, ref } from 'vue'
import { PokemonCard, SearchForm } from '@/components'
import MessageWrapper from '@/components/MessageWrapper.vue'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { loadTeam } from '@/utils/team'
import { searchPokemon } from '../utils/api'

const pokemonData = ref<FormattedPokemon | null>(null)
const loading = ref(false)
const message = ref<Message | null>(null)
const team = ref<FormattedPokemon[]>(loadTeam())

onMounted(() => {
  team.value = loadTeam()
})

async function handleSearch(query: string) {
  if (!query.trim())
    return
  message.value = null
  pokemonData.value = null
  loading.value = true
  try {
    pokemonData.value = await searchPokemon(query)
    message.value = {
      success: true,
      title: 'Pokemon Found!',
    }
  }
  catch (err) {
    message.value = {
      success: false,
      title: err instanceof Error ? err.message : 'Error fetching data',
    }
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="bg-white">
    <h1 class="text-3xl p-2">
      Battle
    </h1>
    <main class="flex-1 p-4">
      <SearchForm :loading="loading" @search="handleSearch" />
      <div class="flex justify-center mt-4">
        <MessageWrapper
          v-if="message && !message.success"
          :message="message"
          variant="destructive"
          show-description
          class="w-sm bg-red-200"
        />
      </div>
      <PokemonCard
        v-if="pokemonData"
        :data="pokemonData"
      />
      <div class="w-full max-w-xs mx-auto mt-4">
        <Table>
          <TableCaption>Your Team ({{ team.length }}/6)</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>
                Name
              </TableHead>
              <TableHead>
                Type(s)
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="pokemon in team" :key="pokemon.name">
              <TableCell>{{ pokemon.name }}</TableCell>
              <TableCell>{{ pokemon.types.join(', ') }}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </main>
  </div>
</template>
