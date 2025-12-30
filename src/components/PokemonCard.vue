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
  <article v-if="!error && data" class="flex justify-center items-center">
    <div v-if="data" class="mt-4 bg-yellow-400 p-4 w-sm border rounded-md">
      <div class="flex justify-between items-center border p-2 bg-gray-300 rounded-md">
        <p class="font-bold text-lg">
          {{ data.name }}
        </p>
        <p class="text-sm">
          Type(s): {{ data.types.join(', ') }}
        </p>
      </div>
      <div class="flex justify-center items-center border rounded-md mt-3 p-2 bg-gray-100">
        <img :src="data.sprites" :alt="data.name">
      </div>
      <div class="flex p-2 justify-center items-center">
        <p class="font-bold text-md">
          Damage Received
        </p>
      </div>
      <div v-if="data.damageRelations" class="bg-gray-100 p-3 border rounded-md">
        <div class="flex border rounded-md">
          <p class="flex justify-center items-center text-sm font-bold p-2 bg-green-400 rounded-l-md border-r">
            Double
          </p>
          <div class="p-2 bg-gray-300 rounded-r-md w-full">
            <p class="text-sm">
              {{ data.damageRelations.doubleDamageFrom.join(', ') }}
            </p>
          </div>
        </div>
        <div class="flex my-3 border rounded-md">
          <p class="flex justify-center items-center text-sm font-bold p-2 bg-pink-400 rounded-l-md border-r">
            Half
          </p>
          <div class="p-2 bg-gray-300 rounded-r-md w-full">
            <p class="text-sm">
              {{ data.damageRelations.halfDamageFrom.join(', ') }}
            </p>
          </div>
        </div>
        <div class="flex border rounded-md">
          <p class="flex justify-center items-center text-sm font-bold p-2 bg-red-500 rounded-l-md border-r">
            None
          </p>
          <div class="p-2 bg-gray-300 rounded-r-md w-full">
            <p class="text-sm">
              {{ data.damageRelations.noDamageFrom.join(', ') }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </article>
</template>
