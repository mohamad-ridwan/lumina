<script setup>
import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'

dayjs.extend(localizedFormat)

const { textMessage, latestMessageTimestamp } = defineProps(['textMessage', 'latestMessageTimestamp'])
</script>

<template>
  <div class="flex flex-col items-end gap-1 pb-2">
    <div class="bg-[#2e74e8] rounded-lg p-2 max-w-xs self-end" style="box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);">
      <p class="text-white text-sm">{{ textMessage }}</p>
    </div>
    <span class="text-xs text-[#111827] self-end">{{ dayjs(latestMessageTimestamp).format('HH.mm') }}</span>
  </div>
</template>
