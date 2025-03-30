<script setup>
import { socket } from '@/services/socket/socket';
import { useChatRoomStore } from '@/stores/chat-room';
import { Button } from 'primevue';
import { onMounted, ref, watch } from 'vue';

// props
const { recipientId, profileId, profileIdConnection } = defineProps(['recipientId', 'profileId', 'profileIdConnection'])

// store
// chat room store
const chatRoomStore = useChatRoomStore()
const { setChatRoom } = chatRoomStore

// state
const username = ref(null)
const userProfileSocketUpdate = ref(null)

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
      userProfileSocketUpdate.value = data
    }
  })
})

watch(userProfileSocketUpdate, (data) => {
  if (
    data?.actionType === 'chat-room' &&
    data?.senderId === profileId &&
    data?.profileIdConnection === profileIdConnection &&
    data?.profile?.id === recipientId
  ) {
    username.value = data.profile.username
  }
})

function handleBack() {
  setChatRoom({})
}
</script>

<template>
  <header class="bg-white p-4 border-b-[#f1f1f1] border-b-[1px] flex items-center gap-4">
    <Button icon="pi pi-angle-left" aria-label="Back"
      class="!rounded-full !bg-transparent hover:!bg-transparent !h-[25px] !w-[25px] justify-center items-center flex cursor-pointer !text-black !outline-none !border-none !p-0"
      size="large" icon-class="!text-lg" @click="handleBack" />
    <h2 class="text-lg font-semibold">{{ username }}</h2>
  </header>
</template>
