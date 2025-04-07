<script setup>
import ChatRoomLayout from '@/layout/chat-room/ChatRoomLayout.vue';
import ChatLayout from '@/layout/chat/ChatLayout.vue';
import { socket } from '@/services/socket/socket';
import { usersStore } from '@/stores/users';
import { storeToRefs } from 'pinia';
import { computed, onBeforeMount } from 'vue';

// store
const userStore = usersStore()
const { profile } = storeToRefs(userStore)

const profileId = computed(() => profile.value?.data.id)

// hooks rendering
onBeforeMount(() => {
  if (profileId.value) {
    socket.emit('userOnline', profileId.value)
  }
})
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-3 min-h-screen">
    <ChatLayout />
    <ChatRoomLayout />
  </div>
</template>
