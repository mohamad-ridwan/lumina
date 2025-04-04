<script setup>
import MainBackground from '@/sections/chat-room/MainBackground.vue';
import RoomView from '@/sections/chat-room/RoomView.vue';
import { socket } from '@/services/socket/socket';
import { useChatRoomStore } from '@/stores/chat-room';
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref, watch } from 'vue';

// store
// chat-room store
const chatRoomStore = useChatRoomStore()
const { setChatRoom } = chatRoomStore
const { chatRoom } = storeToRefs(chatRoomStore)

// state
const newMessageUpdate = ref(null)

// logic
const memoizedChatRoomId = computed(() => {
  return chatRoom.value?.chatRoomId
})
const memoizedChatId = computed(() => {
  return chatRoom.value?.chatId
})
const memoizedChatRoomData = computed(() => {
  return chatRoom.value?.data
})

// hooks rendering
onMounted(() => {
  socket.on('newMessage', (data) => {
    newMessageUpdate.value = data
  })
})

watch(newMessageUpdate, (data) => {
  if (memoizedChatRoomId.value === data?.chatRoomId && data.eventType === 'send-message') {
    setChatRoom({
      ...chatRoom.value,
      data: [data.latestMessage, ...memoizedChatRoomData.value]
    })
  }
})
</script>

<template>
  <div :class="`col-span-2 ${!memoizedChatId ? 'hidden md:block' : 'md:block'}`">
    <MainBackground :chat-id="!memoizedChatId" />
    <template v-if="memoizedChatId">
      <RoomView />
    </template>
  </div>
</template>
