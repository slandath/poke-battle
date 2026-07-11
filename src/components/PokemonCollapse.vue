<script setup lang="ts">
import type { FormattedPokemon } from '@/types/pokemon.ts'
import { ChevronUp } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

const props = defineProps<{ pokemon: FormattedPokemon }>()
const emit = defineEmits(['remove'])

function handleRemove() {
  emit('remove', props.pokemon.name)
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
      <Button class="mt-2" @click="handleRemove">
        Remove
      </Button>
    </CollapsibleContent>
  </Collapsible>
</template>
