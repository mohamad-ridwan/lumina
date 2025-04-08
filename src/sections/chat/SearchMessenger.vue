<script setup>
// import
import Input from '@/components/Input.vue'

// props model
const model = defineModel()
</script>

<template>
  <Input v-model="model" class-icon="left-3" icon="pi-search" input-class="!pl-8" placeholder="Search Messenger.." />
</template>
