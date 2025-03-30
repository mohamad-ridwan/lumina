<script setup>
import MainBackground from '@/sections/chat-room/MainBackground.vue';
import RoomView from '@/sections/chat-room/RoomView.vue';
import { useChatRoomStore } from '@/stores/chat-room';
import { storeToRefs } from 'pinia';

// store
// chat-room store
const chatRoomStore = useChatRoomStore()
const { chatRoom } = storeToRefs(chatRoomStore)
</script>

<template>
  <div class="col-span-2">
    <MainBackground :chat-id="!chatRoom?.chatId" />
    <template v-if="chatRoom?.chatId">
      <RoomView :chat-room="chatRoom" />
    </template>
  </div>


</template>
