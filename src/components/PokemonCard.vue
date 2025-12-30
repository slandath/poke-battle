<script setup lang="ts">
import type { FormattedPokemon } from '../types/pokemon'

defineProps<{
  data: FormattedPokemon | null
  error: string
}>()
</script>

<template>
  <div v-if="error" class="mt-4 bg-red-500 p-4 text-white">
    {{ error }}
  </div>
  <article v-if="!error" class="flex justify-center items-center">
    <div v-if="data" class="mt-4 bg-yellow-400 p-4 w-sm border rounded-md">
      <div class="flex justify-between items-center border p-2 bg-gray-300 rounded-md">
        <p class="font-bold">
          {{ data.name }}
        </p>
        <p class="text-sm">
          Types: {{ data.types }}
        </p>
      </div>
      <div class="flex justify-center items-center border my-3 p-2 bg-gray-100">
        <img :src="data.sprites" :alt="data.name">
      </div>
      <div class="border p-2 my-3 bg-gray-300 rounded-md">
        <p class="text-sm">
          4x
        </p>
      </div>
      <div class="border p-2 bg-gray-300 rounded-md">
        <p class="text-sm">
          2x
        </p>
      </div>
      <div class="border p-2 my-3 bg-gray-300 rounded-md">
        <p class="text-sm">
          Half
        </p>
      </div>
      <div class="border p-2 bg-gray-300 rounded-md">
        <p class="text-sm">
          No Effect
        </p>
      </div>
    </div>
  </article>
</template>
