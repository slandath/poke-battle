<script setup lang="ts">
import type { FormattedPokemon } from '../types/pokemon'
import type { Message } from '@/types/message'
import { Check, Plus } from 'lucide-vue-next'
import { onUnmounted, ref } from 'vue'
import { PokemonCard, SearchForm } from '@/components'
import MessageWrapper from '@/components/MessageWrapper.vue'
import { Button } from '@/components/ui/button'
import { addToTeam } from '@/utils/team'
import { searchPokemon } from '../utils/api'

type ButtonState = 'default' | 'loading' | 'success'

let stateTimer: ReturnType<typeof setTimeout> | null = null
onUnmounted(() => {
  if (stateTimer)
    clearTimeout(stateTimer)
})

const pokemonData = ref<FormattedPokemon | null>(null)
const loading = ref(false)
const message = ref<Message | null>(null)
const buttonState = ref<ButtonState>('default')

async function handleSearch(query: string) {
  if (!query.trim())
    return
  message.value = {
    success: false,
    title: '',
  }
  loading.value = true
  try {
    pokemonData.value = await searchPokemon(query)
    message.value = {
      success: true,
      title: 'Pokemon Found!',
    }
  }
  catch (err) {
    message.value = {
      success: false,
      title: err instanceof Error ? err.message : 'Error fetching data',
    }
  }
  finally {
    loading.value = false
  }
}

function handleAddToTeam() {
  if (!pokemonData.value || buttonState.value !== 'default')
    return
  buttonState.value = 'loading'
  stateTimer = setTimeout(() => {
    if (!pokemonData.value)
      return
    const result = addToTeam(pokemonData.value)
    message.value = {
      success: result.success,
      title: result.title,
    }
    if (result.success) {
      buttonState.value = 'success'
      stateTimer = setTimeout(() => {
        buttonState.value = 'default'
      }, 2000)
    }
    else {
      buttonState.value = 'default'
    }
  }, 400)
}
</script>

<template>
  <h1 class="text-3xl p-2">
    Search
  </h1>
  <main class="flex-1 p-4">
    <SearchForm :loading="loading" @search="handleSearch" />
    <div class="flex justify-center mt-4">
      <MessageWrapper
        v-if="message && !message.success"
        :message="message"
        variant="destructive"
        show-description
        class="w-sm bg-red-200"
      />
    </div>
    <PokemonCard
      v-if="pokemonData || message"
      :data="pokemonData"
    />
    <div class="flex justify-center mt-4">
      <Button
        v-if="pokemonData && message?.success"
        class="hover:cursor-pointer" :class="[
          buttonState === 'loading' && 'bg-gray-400 cursor-not-allowed',
          buttonState === 'success' && 'bg-green-600 text-white',
          buttonState === 'default' && 'bg-blue-500',
        ]"
        :disabled="buttonState === 'loading'"
        @click="handleAddToTeam"
      >
        <LoaderCircle v-if="buttonState === 'loading'" class="size-4 animate-spin" />
        <Check v-else-if="buttonState === 'success'" class="size-4" />
        <Plus v-else class="size-4" />
      </Button>
    </div>
  </main>
</template>
