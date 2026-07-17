<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { Message } from '@/types/message'
import { CircleCheck, CircleX } from 'lucide-vue-next'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

const props = defineProps<{
  message: Message
  variant?: 'default' | 'destructive'
  showDescription?: boolean
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <Alert
    :variant="variant || (message.success ? 'default' : 'destructive')"
    role="alert"
    :class="cn(props.class)"
  >
    <slot name="icon">
      <CircleX v-if="!message.success" class="size-4" />
      <CircleCheck v-else class="size-4" />
    </slot>
    <AlertTitle>{{ message.title }}</AlertTitle>
    <AlertDescription v-if="showDescription && message.content">
      {{ message.content }}
    </AlertDescription>
  </Alert>
</template>
