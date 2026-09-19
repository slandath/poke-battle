<script setup lang="ts">
useHead({ title: "Team - Pokemon Tools" });

const { team, removeFromTeam, refresh } = useTeam();
const { isAuthenticated, isPending } = useAuth();

onMounted(() => {
  void refresh();
});

async function handleRemove(name: string) {
  await removeFromTeam(name);
}
</script>

<template>
  <div class="bg-white">
    <h1 class="p-2 text-3xl">Team</h1>
    <p v-if="isPending" class="p-2">Loading...</p>
    <p v-else-if="!isAuthenticated" class="p-2">
      Sign in to view your team.
      <NuxtLink to="/login" class="text-blue-600 hover:underline">Sign in</NuxtLink>
    </p>
    <p v-else-if="team.length === 0" class="p-2">
      Your team is empty. Search for a pokemon to add!
    </p>
    <PokemonCollapse
      v-for="pokemon in team"
      :key="pokemon.name"
      :pokemon="pokemon"
      @remove="handleRemove"
    />
  </div>
</template>
