<script setup lang="ts">
useHead({ title: "Battle - Pokemon Tools" });

const { pokemonData, loading, message, search } = usePokemonSearch();
const { team } = useTeam();

onMounted(() => {
  const { refresh } = useTeam();
  void refresh();
});
</script>

<template>
  <div class="bg-white">
    <h1 class="p-2 text-3xl">Battle</h1>
    <main class="flex-1 p-4">
      <SearchForm :loading="loading" @search="search" />
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
