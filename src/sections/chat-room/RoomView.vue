<script setup>
import { usersStore } from '@/stores/users';
import FooterChatRoom from './FooterChatRoom.vue';
import HeaderChatRoom from './HeaderChatRoom.vue';
import SenderMessage from './SenderMessage.vue';
import RecipientMessage from './RecipientMessage.vue';
import { computed, onBeforeUnmount, onMounted, onUnmounted } from 'vue';
import { socket } from '@/services/socket/socket';
import SpamMessage from '@/spam-message/SpamMessage.vue';
import { useChatRoomStore } from '@/stores/chat-room';
import { storeToRefs } from 'pinia';

// store
// profile store
const userStore = usersStore()
const { profile, profileIdConnection } = userStore
// chat-room store
const chatRoomStore = useChatRoomStore()
const { chatRoom } = storeToRefs(chatRoomStore)

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
const memoizedUserIds = computed(() => {
  return chatRoom.value?.userIds
})

function handleBeforeUnload() {
  if (memoizedChatId.value) {
    socket.emit('leaveRoom', {
      chatRoomId: memoizedChatRoomId.value,
      chatId: memoizedChatId.value,
      userId: profile?.data.id
    })
  }
}

// hooks rendering
onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload);
});

onUnmounted(() => {
  // leave room
  socket.emit('leaveRoom', {
    chatRoomId: memoizedChatRoomId.value,
    chatId: memoizedChatId.value,
    userId: profile?.data.id
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload);

  if (memoizedChatId.value) {
    socket.emit('leaveRoom', {
      chatRoomId: memoizedChatRoomId.value,
      chatId: memoizedChatId.value,
      userId: profile?.data.id
    })
  }
})

</script>

<template>
  <!-- <SpamMessage /> -->
  <div class="flex flex-col h-screen border-l-[#f1f1f1] border-l-[1px]">
    <HeaderChatRoom :recipient-id="memoizedUserIds.filter(id => id !== profile.data.id)?.[0]"
      :profile-id="profile.data.id" :profile-id-connection="profileIdConnection" />

    <main class="flex-1 overflow-y-auto p-4 space-y-2 flex flex-col-reverse bg-[#f9fafb]">
      <template v-for="item in memoizedChatRoomData" :key="item.messageId">
        <SenderMessage v-if="item.senderUserId === profile.data.id" :text-message="item.textMessage"
          :latest-message-timestamp="item.latestMessageTimestamp" :status="item.status" :message-id="item.messageId" />
        <RecipientMessage v-if="item.senderUserId !== profile.data.id" :text-message="item.textMessage"
          :latest-message-timestamp="item.latestMessageTimestamp" :status="item.status" :chat-id="memoizedChatId"
          :chat-room-id="memoizedChatRoomId" :message-id="item.messageId" />
      </template>
    </main>

    <FooterChatRoom />
  </div>
</template>
