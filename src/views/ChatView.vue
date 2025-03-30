<script setup>
import ChatRoomLayout from '@/layout/chat-room/ChatRoomLayout.vue';
import ChatLayout from '@/layout/chat/ChatLayout.vue';

</script>

<template>
  <div class="grid grid-cols-3 min-h-screen">
    <ChatLayout />
    <ChatRoomLayout />
  </div>
</template>
