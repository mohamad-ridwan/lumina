<script setup>

// props
const { date } = defineProps(['date'])
</script>

<template>
  <div class="sticky bottom-0 flex justify-center items-center z-50 py-2">
    <div class="bg-[#e0e0e0] px-2 py-1 rounded-md flex justify-center items-center">
      <span class="font-bold text-xs rotate-180">{{ date }}</span>
    </div>
  </div>
</template>
