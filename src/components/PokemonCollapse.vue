<script setup lang="ts">
import type { FormattedPokemon } from '@/types/pokemon.ts'
import { Check, ChevronUp, LoaderCircle, Trash2 } from 'lucide-vue-next'
import { onUnmounted, ref } from 'vue'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

type RemoveState = 'default' | 'loading' | 'success'

const props = defineProps<{ pokemon: FormattedPokemon }>()
const emit = defineEmits(['remove'])
const removeState = ref<RemoveState>('default')
let stateTimer: ReturnType<typeof setTimeout> | null = null

onUnmounted(() => {
  if (stateTimer)
    clearTimeout(stateTimer)
})

function handleRemove() {
  if (removeState.value !== 'default')
    return
  removeState.value = 'loading'
  emit('remove', props.pokemon.name)
  stateTimer = setTimeout(() => {
    removeState.value = 'success'
    stateTimer = setTimeout(() => {
      removeState.value = 'default'
    }, 2000)
  }, 400)
}
</script>

<template>
  <Collapsible class="bg-blue-300 p-2">
    <CollapsibleTrigger class="flex gap-2 hover:cursor-pointer [&[data-state=open]>svg]:rotate-180">
      <p>
        {{ pokemon.name }}:
      </p>
      <p>{{ pokemon.types.join(', ') }}</p>
      <ChevronUp class="transition-transform duration-300" />
    </CollapsibleTrigger>
    <CollapsibleContent>
      <Button
        class="mt-2 hover:cursor-pointer"
        :class="[
          removeState === 'loading' && 'bg-gray-400 cursor-not-allowed',
          removeState === 'success' && 'bg-green-600 text-white',
        ]"
        :disabled="removeState === 'loading'"
        @click="handleRemove"
      >
        <LoaderCircle v-if="removeState === 'loading'" class="size-4 animate-spin" />
        <Check v-else-if="removeState === 'success'" class="size-4" />
        <Trash2 v-else class="size-4" />
      </Button>
    </CollapsibleContent>
  </Collapsible>
</template>
