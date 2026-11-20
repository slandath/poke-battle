<script setup lang="ts">
import { LoaderCircle, Search } from "lucide-vue-next";
import { computed, onMounted, onUnmounted, ref } from "vue";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { pokeApiLimiter } from "~/utils/rateLimiter";

defineProps<{
  loading: boolean;
}>();

const emit = defineEmits<{
  search: [query: string];
}>();

const searchQuery = ref("");
const { status } = pokeApiLimiter;

const limited = computed(() => status.value.limited);
const statusMessage = computed(() => {
  const { limited: isLimited, remaining, resetInSeconds, warning } = status.value;
  if (isLimited) return `Rate limit reached. Try again in ${resetInSeconds}s`;
  if (warning) return `${remaining} requests remaining`;
  return "";
});

onMounted(() => pokeApiLimiter.startTicking());
onUnmounted(() => pokeApiLimiter.stopTicking());

function handleSubmit() {
  if (!searchQuery.value.trim()) return;
  emit("search", searchQuery.value);
}

/** Called by the parent once a search succeeds; keeps the query on errors. */
function clear() {
  searchQuery.value = "";
}

defineExpose({ clear });
</script>

<template>
  <div class="flex flex-col items-center">
    <form class="flex justify-center" :aria-busy="loading" @submit.prevent="handleSubmit">
      <div class="flex w-full max-w-xs items-center space-x-2">
        <label for="pokemon" class="sr-only">Pokemon Name</label>
        <Input
          id="pokemon"
          v-model="searchQuery"
          type="text"
          name="pokemon"
          placeholder="Pokemon Name"
        />
        <Button
          type="submit"
          :disabled="loading || limited"
          :aria-label="loading ? 'Searching for Pokemon' : 'Search for Pokemon'"
          class="bg-blue-500 hover:cursor-pointer"
        >
          <LoaderCircle v-if="loading" class="size-4 animate-spin" />
          <Search v-else class="size-4" />
        </Button>
      </div>
    </form>
    <p
      v-if="statusMessage"
      role="status"
      aria-live="polite"
      class="mt-1 text-sm"
      :class="limited ? 'text-red-600' : 'text-yellow-600'"
    >
      {{ statusMessage }}
    </p>
  </div>
</template>
