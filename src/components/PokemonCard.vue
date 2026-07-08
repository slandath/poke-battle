<script setup lang="ts">
import type { FormattedPokemon } from '../types/pokemon'
import { Card } from '@/components/ui/card'

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
    <Card class="mt-4 w-sm bg-yellow-400 p-4">
      <CardHeader>
        <CardTitle>
          <div
            class="flex items-center justify-between rounded-md bg-gray-300 p-2"
          >
            <p class="text-lg font-bold">
              {{ data.name }}
            </p>
            <p class="text-sm">
              Type(s): {{ data.types.join(', ') }}
            </p>
          </div>
        </CardTitle>
        <CardContent>
          <div
            class="mt-3 flex items-center justify-center rounded-md bg-gray-100 p-2"
          >
            <img :src="data.sprites" :alt="data.name">
          </div>
          <div class="flex items-center justify-center p-2">
            <p class="text-md font-bold">
              Type Effectiveness
            </p>
          </div>
          <div
            v-if="data.damageRelations"
            class="rounded-md bg-gray-100 p-3"
          >
            <div class="flex rounded-md">
              <p
                class="flex items-center justify-center rounded-l-md bg-green-400 p-2 text-sm font-bold"
              >
                Weak
              </p>
              <div class="w-full rounded-r-md bg-gray-300 p-2">
                <p class="text-sm">
                  {{ data.damageRelations.doubleDamageFrom.join(', ') }}
                </p>
              </div>
            </div>
            <div class="my-3 flex rounded-md">
              <p
                class="flex items-center justify-center rounded-l-md bg-pink-400 p-2 text-sm font-bold"
              >
                Resistant
              </p>
              <div class="w-full rounded-r-md bg-gray-300 p-2">
                <p class="text-sm">
                  {{ data.damageRelations.halfDamageFrom.join(', ') }}
                </p>
              </div>
            </div>
            <div class="flex rounded-md">
              <p
                class="flex items-center justify-center rounded-l-md bg-red-500 p-2 text-sm font-bold"
              >
                Immune
              </p>
              <div class="w-full rounded-r-md bg-gray-300 p-2">
                <p class="text-sm">
                  {{ data.damageRelations.noDamageFrom.join(', ') }}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </CardHeader>
    </Card>
  </article>
</template>
