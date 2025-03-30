<script setup>
import { socket } from '@/services/socket/socket';
import { onMounted, ref, watch } from 'vue';

// props
const { recipientId, profileId, profileIdConnection } = defineProps(['recipientId', 'profileId', 'profileIdConnection'])

// state
const username = ref(null)

// hooks rendering
watch(() => {
  socket.emit('user-profile', {
    profileId: recipientId,
    senderId: profileId,
    profileIdConnection,
    actionType: 'chat-room'
  })
})

onMounted(() => {
  socket.on('user-profile', (data) => {
    if (
      data?.actionType === 'chat-room' &&
      data?.senderId === profileId &&
      data?.profileIdConnection === profileIdConnection &&
      data?.profile?.id === recipientId
    ) {
      username.value = data.profile.username
    }
  })
})
</script>

<template>
  <header class="bg-white p-4 border-b-[#f1f1f1]">
    <h2 class="text-lg font-semibold">{{ username }}</h2>
  </header>
</template>
