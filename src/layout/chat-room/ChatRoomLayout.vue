<script setup>
import MainBackground from '@/sections/chat-room/MainBackground.vue';
import RoomView from '@/sections/chat-room/RoomView.vue';
import { socket } from '@/services/socket/socket';
import { useChatRoomStore } from '@/stores/chat-room';
import { storeToRefs } from 'pinia';
import { onMounted } from 'vue';

// store
// chat-room store
const chatRoomStore = useChatRoomStore()
const { setChatRoom } = chatRoomStore
const { chatRoom } = storeToRefs(chatRoomStore)

onMounted(() => {
  socket.on('newMessage', (data) => {
    if (chatRoom.value?.chatRoomId === data?.chatRoomId && data.eventType === 'send-message') {
      setChatRoom({
        ...chatRoom.value,
        data: [data.latestMessage, ...chatRoom.value.data]
      })
    }
  })
})
</script>

<template>
  <div class="col-span-2">
    <MainBackground :chat-id="!chatRoom?.chatId" />
    <template v-if="chatRoom?.chatId">
      <RoomView :chat-room="chatRoom" />
    </template>
  </div>


</template>
