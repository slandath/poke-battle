<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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
    <div class="flex w-full max-w-sm items-center space-x-2">
      <Input
        id="pokemon"
        v-model="searchQuery"
        type="text"
        name="pokemon"
        placeholder="Pokemon Name"
      />
      <Button
        type="submit"
        :disabled="loading"
        class="bg-blue-500"
      >
        {{ loading ? 'Searching...' : 'Search' }}
      </Button>
    </div>
  </form>
</template>
