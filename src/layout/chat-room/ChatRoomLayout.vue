<script setup>
import ImageLightBox from '@/components/media/ImageLightBox.vue';
import ConfirmDeleteMessageModal from '@/components/modals/ConfirmDeleteMessageModal.vue';
import MediaAttachmentPreview from '@/components/modals/MediaAttachmentPreview.vue';
import MainBackground from '@/sections/chat-room/MainBackground.vue';
import RoomView from '@/sections/chat-room/RoomView.vue';
import { socket } from '@/services/socket/socket';
import { useChatRoomStore } from '@/stores/chat-room';
import { usersStore } from '@/stores/users';
import { storeToRefs } from 'pinia';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

// store
// profile store
const userStore = usersStore()
const { profile } = storeToRefs(userStore)
// chat-room store
const chatRoomStore = useChatRoomStore()
const { resetChatRoomEventSource, handleAddNewMessage } = chatRoomStore
const { chatRoom, chatRoomEventSource } = storeToRefs(chatRoomStore)

// state
const newMessageUpdate = ref(null)

// logic
const memoizedChatRoomId = computed(() => {
  return chatRoom.value?.chatRoomId
})
const memoizedChatId = computed(() => {
  return chatRoom.value?.chatId
})

// Hooks rendering
onMounted(() => {
  socket.on('newMessage', (data) => {
    newMessageUpdate.value = data
  })
})

onBeforeUnmount(() => {
  if (chatRoomEventSource.value) {
    resetChatRoomEventSource()
  }
})

watch(newMessageUpdate, (data) => {
  if (memoizedChatRoomId.value === data?.chatRoomId && data.eventType === 'send-message') {
    handleAddNewMessage(data, profile.value?.data.id)
  }
})
</script>

<template>
  <!-- modal confirm delete message -->
  <ConfirmDeleteMessageModal />
  <!-- modal send attachment -->
  <MediaAttachmentPreview />
  <!-- MEDIA -->
  <ImageLightBox />
  <div :class="`col-span-2 ${!memoizedChatId ? 'hidden md:block' : 'md:block'}`">
    <MainBackground :chat-id="!memoizedChatId" />
    <template v-if="memoizedChatId">
      <div id="roomView" class="flex box-border overflow-hidden">
        <RoomView />
      </div>
    </template>
  </div>
</template>

<style scoped>
html,
body,
#app {
  overflow: hidden;
}

#roomView {
  height: -webkit-fill-available;
  height: 100dvh;
}
</style>
