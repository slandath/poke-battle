<script setup lang="ts">
import type { HallOfFameEntry } from "#shared/types/pokemon";

useHead({ title: "Hall of Fame - Pokemon Tools" });

const { isAuthenticated, isPending } = useAuth();
const { versions, selectedVersion } = useVersions();
const filter = useState<string>("hall-of-fame-filter", () => "all");
const entries = ref<HallOfFameEntry[]>([]);
const loading = ref(false);
const message = ref<{ success: boolean; title: string } | null>(null);

async function loadHall() {
  if (!import.meta.client || !isAuthenticated.value) return;
  loading.value = true;
  const requested = filter.value;
  try {
    const data = await $fetch<HallOfFameEntry[]>("/api/hall-of-fame", {
      query: { version: requested },
    });
    if (filter.value === requested) entries.value = data;
  } catch (err: unknown) {
    console.error(err);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  void loadHall();
});

watch([isAuthenticated, filter], () => {
  void loadHall();
});

async function handleDelete(id: number) {
  if (!confirm("Delete this memorial?")) return;
  try {
    await $fetch(`/api/hall-of-fame/${id}`, { method: "DELETE" });
    message.value = { success: true, title: "Memorial deleted" };
    await loadHall();
  } catch (err: unknown) {
    console.error(err);
    message.value = { success: false, title: "Error deleting memorial" };
  }
}

function formatDate(value?: string) {
  if (!value) return "";
  return new Date(value).toLocaleDateString();
}
</script>

<template>
  <div class="bg-white">
    <h1 class="p-2 text-3xl">Hall of Fame</h1>
    <p v-if="isPending || loading" class="p-2">Loading...</p>
    <p v-else-if="!isAuthenticated" class="p-2">
      Sign in to view your Hall of Fame.
      <NuxtLink to="/login" class="text-blue-600 hover:underline">Sign in</NuxtLink>
    </p>
    <template v-else>
      <div class="flex items-center gap-2 p-2">
        <label for="hof-filter" class="text-sm">Game:</label>
        <select id="hof-filter" v-model="filter" class="rounded border px-2 py-1 text-sm">
          <option value="all">All games</option>
          <option
            v-for="version in versions.length > 0 ? versions : [selectedVersion]"
            :key="version"
            :value="version"
          >
            {{ version }}
          </option>
        </select>
      </div>
      <p
        v-if="message"
        class="p-2 text-sm"
        :class="message.success ? 'text-green-600' : 'text-red-600'"
      >
        {{ message.title }}
      </p>
      <p v-if="entries.length === 0" class="p-2">
        No enshrined teams yet. Beat a game, then enshrine your team from the Team page!
      </p>
      <div v-for="entry in entries" :key="entry.id" class="m-2 rounded border p-3">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold">
            {{ entry.title || `${entry.version} champions` }}
          </h2>
          <button
            type="button"
            class="rounded bg-red-500 px-2 py-1 text-sm text-white hover:cursor-pointer hover:bg-red-600"
            @click="handleDelete(entry.id)"
          >
            Delete
          </button>
        </div>
        <p class="text-sm text-gray-600">
          {{ entry.version }} · {{ entry.pokemon.length }}/6 · {{ formatDate(entry.enshrinedAt) }}
        </p>
        <p v-if="entry.notes" class="mt-1 text-sm">{{ entry.notes }}</p>
        <ul class="mt-2 list-disc pl-5">
          <li v-for="mon in entry.pokemon" :key="mon.name">
            {{ mon.name }} ({{ mon.types.join(", ") }})
          </li>
        </ul>
      </div>
    </template>
  </div>
</template>
