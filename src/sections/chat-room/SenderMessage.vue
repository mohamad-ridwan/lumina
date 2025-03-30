<script setup>
const { textMessage } = defineProps(['textMessage'])
</script>

<template>
  <div class="flex flex-col items-end gap-1 pb-2">
    <div class="bg-[#2e74e8] rounded-lg p-2 max-w-xs self-end" style="box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);">
      <p class="text-white text-sm">{{ textMessage }}</p>
    </div>
    <span class="text-xs text-[#111827] self-end">10:01 AM</span>
  </div>
</template>
