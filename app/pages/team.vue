<script setup lang="ts">
import type { Message } from "#shared/types/message";

useHead({ title: "Team - Pokemon Tools" });

const { team, selectedVersion, removeFromTeam, enshrineTeam, refresh } = useTeam();
const { isAuthenticated, isPending } = useAuth();

const title = ref("");
const notes = ref("");
const enshrining = ref(false);
const enshrineMessage = ref<Message | null>(null);

onMounted(() => {
  void refresh();
});

async function handleRemove(name: string) {
  await removeFromTeam(name);
}

async function handleEnshrine() {
  if (team.value.length === 0 || enshrining.value) return;
  if (!confirm(`Enshrine your ${selectedVersion.value} team of ${team.value.length} Pokémon?`)) {
    return;
  }
  enshrining.value = true;
  try {
    const result = await enshrineTeam(title.value || undefined, notes.value || undefined);
    enshrineMessage.value = result;
    if (result.success) {
      title.value = "";
      notes.value = "";
      await navigateTo("/hall-of-fame");
    }
  } finally {
    enshrining.value = false;
  }
}
</script>

<template>
  <div class="bg-white">
    <h1 class="p-2 text-3xl">Team ({{ selectedVersion }})</h1>
    <p v-if="isPending" class="p-2">Loading...</p>
    <p v-else-if="!isAuthenticated" class="p-2">
      Sign in to view your team.
      <NuxtLink to="/login" class="text-blue-600 hover:underline">Sign in</NuxtLink>
    </p>
    <template v-else>
      <p v-if="team.length === 0" class="p-2">Your team is empty. Search for a pokemon to add!</p>
      <PokemonCollapse
        v-for="pokemon in team"
        :key="pokemon.name"
        :pokemon="pokemon"
        @remove="handleRemove"
      />
      <div v-if="team.length > 0" class="mt-4 border-t p-4">
        <h2 class="text-xl">Enshrine this team</h2>
        <p class="text-sm text-gray-600">
          Beat {{ selectedVersion }} with this team? Enshrine it in the Hall of Fame and start a
          fresh team.
        </p>
        <div class="mt-2 flex max-w-md flex-col gap-2">
          <input
            v-model="title"
            type="text"
            maxlength="120"
            placeholder="Title (optional)"
            class="rounded border px-2 py-1"
          />
          <textarea
            v-model="notes"
            maxlength="2000"
            placeholder="Notes (optional)"
            class="rounded border px-2 py-1"
          />
          <button
            type="button"
            :disabled="enshrining"
            class="rounded bg-amber-500 px-4 py-2 text-white hover:cursor-pointer hover:bg-amber-600 disabled:bg-gray-400"
            @click="handleEnshrine"
          >
            {{ enshrining ? "Enshrining…" : "Enshrine team" }}
          </button>
          <p v-if="enshrineMessage && !enshrineMessage.success" class="text-sm text-red-600">
            {{ enshrineMessage.title }}
          </p>
        </div>
      </div>
    </template>
  </div>
</template>
