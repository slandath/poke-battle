<script setup lang="ts">
useHead({ title: "Team - Pokemon Tools" });

const { team, removeFromTeam } = useTeam();

function handleRemove(name: string) {
  removeFromTeam(name);
}
</script>

<template>
  <div class="bg-white">
    <h1 class="p-2 text-3xl">Team</h1>
    <p v-if="team.length === 0" class="p-2">Your team is empty. Search for a pokemon to add!</p>
    <PokemonCollapse
      v-for="pokemon in team"
      :key="pokemon.name"
      :pokemon="pokemon"
      @remove="handleRemove"
    />
  </div>
</template>
