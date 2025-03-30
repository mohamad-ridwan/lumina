<script setup>
import { socket } from '@/services/socket/socket'
import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import { onMounted } from 'vue'

dayjs.extend(localizedFormat)

const { textMessage, latestMessageTimestamp, status, chatId, chatRoomId, messageId } = defineProps(['textMessage', 'latestMessageTimestamp', 'status', 'chatRoomId', 'chatId', 'messageId'])

onMounted(() => {
  if (status === 'UNREAD') {
    socket.emit('markMessageAsRead', {
      chatRoomId,
      chatId,
      messageId,
      status: 'READ'
    })
  }
})
</script>

<template>
  <div class="flex flex-col gap-1 pb-2">
    <div class="bg-[#f1f1f1] rounded-lg p-2 max-w-xs self-start" style="box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);">
      <p class="text-sm">{{ textMessage }}</p>
    </div>
    <span class="text-xs text-[#111827] self-start">{{ dayjs(latestMessageTimestamp).format('HH.mm') }}</span>
  </div>
</template>
