<script setup>
import { Button } from 'primevue'

const props = defineProps(['title'])
const { title } = props

const emit = defineEmits(['handleBack'])

const handleBack = () => {
  emit('handleBack')
}
</script>

<template>
  <div class="p-3 flex items-center gap-3 bg-white">
    <Button icon="pi pi-angle-left" type="button" aria-label="Back" rounded icon-class="text-black" severity="secondary"
      size="small" @click="handleBack" />
    <h1 class="font-bold text-lg">{{ title }}</h1>
  </div>
</template>
