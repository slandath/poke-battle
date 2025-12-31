<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  loading: boolean
}>()

const emit = defineEmits<{
  search: [query: string]
}>()

const searchQuery = ref('')

function handleSubmit() {
  if (!searchQuery.value.trim())
    return
  emit('search', searchQuery.value)
  searchQuery.value = ''
}
</script>

<template>
  <form class="flex justify-center" @submit.prevent="handleSubmit">
    <div class="w-sm">
      <label for="pokemon" class="block text-sm/6 font-medium text-gray-600">
        Pokemon Name
      </label>
      <div class="mt-2">
        <div
          class="flex items-center rounded-md bg-white/5 pl-3 outline-1 -outline-offset-1 outline-gray-600 has-[input:focus-within]:outline-2 has-[input:focus-within]:-outline-offset-2 has-[input:focus-within]:outline-blue-500"
        >
          <input
            id="pokemon"
            v-model="searchQuery"
            type="text"
            name="pokemon"
            class="block min-w-0 grow py-1.5 pr-3 pl-1 text-base text-gray-600 focus:outline-none sm:text-sm/6"
          >
          <button
            type="submit"
            class="cursor-pointer border bg-blue-500 p-2 text-white text-shadow-md rounded-r-md"
            :disabled="loading"
          >
            {{ loading ? 'Searching...' : 'Search' }}
          </button>
        </div>
      </div>
    </div>
  </form>
</template>
