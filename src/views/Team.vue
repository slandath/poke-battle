<script setup lang="ts">
import type { FormattedPokemon } from '@/types/pokemon'
import { ref } from 'vue'
import { PokemonCollapse } from '@/components'
import { loadTeam, removeFromTeam } from '@/utils/team'

const team = ref<FormattedPokemon[]>(loadTeam())

function handleRemove(name: string) {
  team.value = removeFromTeam(name)
}
</script>

<template>
  <div class="bg-white">
    <h1 class="text-3xl p-2">
      Team
    </h1>
    <p v-if="team.length === 0" class="p-2">
      Your team is empty. Search for a pokemon to add!
    </p>
    <PokemonCollapse v-for="pokemon in team" :key="pokemon.name" :pokemon="pokemon" @remove="handleRemove" />
  </div>
</template>
