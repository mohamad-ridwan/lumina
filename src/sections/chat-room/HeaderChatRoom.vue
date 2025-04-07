<script setup>
import { socket } from '@/services/socket/socket';
import { useChatRoomStore } from '@/stores/chat-room';
import { storeToRefs } from 'pinia';
import { Button } from 'primevue';
import { computed, onMounted, ref, shallowRef, watch } from 'vue';

// props
const { recipientId, profileId, profileIdConnection } = defineProps(['recipientId', 'profileId', 'profileIdConnection'])

// store
// chat room store
const chatRoomStore = useChatRoomStore()
const { setChatRoom, resetChatRoomEventSource } = chatRoomStore
const { chatRoom, chatRoomEventSource } = storeToRefs(chatRoomStore)

// state
const username = shallowRef(null)
const image = shallowRef(null)
const userProfileSocketUpdate = ref(null)

// logic
const memoizedChatRoomId = computed(() => {
  return chatRoom.value?.chatRoomId
})
const memoizedChatId = computed(() => {
  return chatRoom.value?.chatId
})

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
    image.value = data.profile.image
  }
})

function handleBack() {
  if (chatRoomEventSource.value) {
    resetChatRoomEventSource()
  }
  if (memoizedChatId.value) {
    socket.emit('leaveRoom', {
      chatRoomId: memoizedChatRoomId.value,
      chatId: memoizedChatId.value,
      userId: profileId
    })
  }
  setChatRoom({})
}
</script>

<template>
  <header class="bg-white px-4 py-3 border-b-[#f1f1f1] border-b-[1px] flex items-center gap-4">
    <Button icon="pi pi-angle-left" aria-label="Back"
      class="!rounded-full !bg-transparent hover:!bg-transparent !h-[25px] !w-[25px] justify-center items-center flex cursor-pointer !text-black !outline-none !border-none !p-0"
      size="large" icon-class="!text-lg" @click="handleBack" />
    <div class="flex items-center gap-3">
      <img :src="image" alt="profile" :class="`object-cover rounded-full h-10 w-10 sm:h-11 sm:w-11`">
      <h2 class="text-sm sm:text-lg font-semibold">{{ username }}</h2>
    </div>
  </header>
</template>
