<script setup lang="ts">
import { ChevronUp } from 'lucide-vue-next'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
</script>

<template>
  <Collapsible class="bg-blue-300 p-2">
    <CollapsibleTrigger class="flex gap-2 :hover cursor-pointer [&[data-state=open]>svg]:rotate-180">
      <p>
        Pokemon Name
      </p>
      <p>Type(s): Type</p>
      <ChevronUp class="transition-transform duration-300" />
    </CollapsibleTrigger>
    <CollapsibleContent>
      <p class="py-3">
        Pokemon Attributes
      </p>
    </CollapsibleContent>
  </Collapsible>
</template>
