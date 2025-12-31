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
  <article v-if="!error && data" class="flex items-center justify-center">
    <div v-if="data" class="mt-4 w-sm rounded-md border bg-yellow-400 p-4">
      <div
        class="flex items-center justify-between rounded-md border bg-gray-300 p-2"
      >
        <p class="text-lg font-bold">
          {{ data.name }}
        </p>
        <p class="text-sm">
          Type(s): {{ data.types.join(', ') }}
        </p>
      </div>
      <div
        class="mt-3 flex items-center justify-center rounded-md border bg-gray-100 p-2"
      >
        <img :src="data.sprites" :alt="data.name">
      </div>
      <div class="flex items-center justify-center p-2">
        <p class="text-md font-bold">
          Damage Received
        </p>
      </div>
      <div
        v-if="data.damageRelations"
        class="rounded-md border bg-gray-100 p-3"
      >
        <div class="flex rounded-md border">
          <p
            class="flex items-center justify-center rounded-l-md border-r bg-green-400 p-2 text-sm font-bold"
          >
            Double
          </p>
          <div class="w-full rounded-r-md bg-gray-300 p-2">
            <p class="text-sm">
              {{ data.damageRelations.doubleDamageFrom.join(', ') }}
            </p>
          </div>
        </div>
        <div class="my-3 flex rounded-md border">
          <p
            class="flex items-center justify-center rounded-l-md border-r bg-pink-400 p-2 text-sm font-bold"
          >
            Half
          </p>
          <div class="w-full rounded-r-md bg-gray-300 p-2">
            <p class="text-sm">
              {{ data.damageRelations.halfDamageFrom.join(', ') }}
            </p>
          </div>
        </div>
        <div class="flex rounded-md border">
          <p
            class="flex items-center justify-center rounded-l-md border-r bg-red-500 p-2 text-sm font-bold"
          >
            None
          </p>
          <div class="w-full rounded-r-md bg-gray-300 p-2">
            <p class="text-sm">
              {{ data.damageRelations.noDamageFrom.join(', ') }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </article>
</template>
