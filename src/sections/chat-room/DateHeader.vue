<script setup>

// props
const { date } = defineProps(['date'])
</script>

<template>
  <div class="flex justify-center items-center">
    <div class="bg-[#e0e0e0] px-2 py-1 rounded-md flex justify-center items-center">
      <span class="font-bold text-xs rotate-180" style="direction: ltr;">{{ date }}</span>
    </div>
  </div>
</template>
