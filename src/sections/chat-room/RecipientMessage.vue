<script setup>
const { textMessage } = defineProps(['textMessage'])
</script>

<template>
  <div class="flex flex-col gap-1 pb-2">
    <div class="bg-[#f1f1f1] rounded-lg p-2 max-w-xs self-start" style="box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);">
      <p class="text-sm">{{ textMessage }}</p>
    </div>
    <span class="text-xs text-[#111827] self-start">10:00 AM</span>
  </div>
</template>
