<script setup>
import MessageActionMenu from '@/components/menu/MessageActionMenu.vue'
import { socket } from '@/services/socket/socket'
import { useChatRoomStore } from '@/stores/chat-room'
import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import { storeToRefs } from 'pinia'
import { onMounted } from 'vue'

dayjs.extend(localizedFormat)

const { textMessage, latestMessageTimestamp, status, chatId, chatRoomId, messageId, messageType, senderUserId } = defineProps(['textMessage', 'latestMessageTimestamp', 'status', 'chatRoomId', 'chatId', 'messageId', 'messageType', 'senderUserId'])

// store
// chat-room store
const chatRoomStore = useChatRoomStore()
const { activeMessageMenu } = storeToRefs(chatRoomStore)

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
  <div class="flex flex-col-reverse gap-1 pb-2">
    <div class="group bg-[#f1f1f1] rounded-tl-md rounded-bl-md rounded-br-lg p-2 max-w-xs self-start relative"
      style="box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);">
      <!-- Menu reply -->
      <div
        :class="`absolute right-0 bottom-0 p-1 ${activeMessageMenu === messageId ? 'flex' : 'hidden group-hover:flex'} z-[1]`">
        <MessageActionMenu :message="{ textMessage, messageId, messageType, senderUserId }" />
      </div>
      <p class="text-sm text-start rotate-180" style="direction: ltr;" v-html="textMessage"></p>
    </div>
    <span class="text-xs text-[#111827] self-start rotate-180">
      {{ dayjs(Number(latestMessageTimestamp)).format('HH.mm') }}
    </span>
  </div>
</template>
