<script setup>
// import
import Input from '@/components/Input.vue'

const { icon } = defineProps({
  icon: {
    type: String,
    default: 'pi-search'
  }
})

// props model
const model = defineModel()
</script>

<template>
  <Input v-model="model" class-icon="left-3" :icon=icon input-class="!pl-8" placeholder="Search Messenger.." />
</template>
