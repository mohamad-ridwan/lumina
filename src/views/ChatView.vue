<script setup>
import ChatRoomLayout from '@/layout/chat-room/ChatRoomLayout.vue';
import ChatLayout from '@/layout/chat/ChatLayout.vue';
import { socket } from '@/services/socket/socket';
import { onMounted, onUnmounted } from 'vue';

onMounted(() => {
  socket.emit('connection')
})

onUnmounted(() => {
  socket.emit('disconnect')
})

</script>

<template>
  <div class="grid grid-cols-3 min-h-screen">
    <ChatLayout />
    <ChatRoomLayout />
  </div>
</template>
