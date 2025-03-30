<script setup>
const { chatId } = defineProps(['chatId'])
</script>

<template>
  <div v-if="chatId" class="flex justify-center items-center flex-col h-full bg-[#2e74e8]">
    <img src="../../assets/images/auth.png" alt="" class="max-w-[500px]">
  </div>
</template>
