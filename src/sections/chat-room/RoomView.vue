<script setup>
import { usersStore } from '@/stores/users';
import FooterChatRoom from './FooterChatRoom.vue';
import HeaderChatRoom from './HeaderChatRoom.vue';
import SenderMessage from './SenderMessage.vue';
import RecipientMessage from './RecipientMessage.vue';
import { onBeforeUnmount, onMounted, onUnmounted } from 'vue';
import { socket } from '@/services/socket/socket';

// store
// profile store
const userStore = usersStore()
const { profile, profileIdConnection } = userStore

// props
const { chatRoom } = defineProps(['chatRoom'])

onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload);
});

function handleBeforeUnload() {
  if (chatRoom?.chatId) {
    socket.emit('leaveRoom', {
      chatRoomId: chatRoom?.chatRoomId,
      chatId: chatRoom?.chatId,
      userId: profile?.data.id
    })
  }
}

onUnmounted(() => {
  // leave room
  socket.emit('leaveRoom', {
    chatRoomId: chatRoom?.chatRoomId,
    chatId: chatRoom?.chatId,
    userId: profile?.data.id
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload);

  if (chatRoom?.chatId) {
    socket.emit('leaveRoom', {
      chatRoomId: chatRoom?.chatRoomId,
      chatId: chatRoom?.chatId,
      userId: profile?.data.id
    })
  }
})

</script>

<template>
  <div class="flex flex-col h-screen border-l-[#f1f1f1] border-l-[1px]">
    <HeaderChatRoom :recipient-id="chatRoom.userIds.filter(id => id !== profile.data.id)?.[0]"
      :profile-id="profile.data.id" :profile-id-connection="profileIdConnection" />

    <main class="flex-1 overflow-y-auto p-4 space-y-2 flex flex-col-reverse bg-[#f9fafb]">
      <template v-for="item in chatRoom.data" :key="item.messageId">
        <SenderMessage v-if="item.senderUserId === profile.data.id" :text-message="item.textMessage"
          :latest-message-timestamp="item.latestMessageTimestamp" :status="item.status" :message-id="item.messageId" />
        <RecipientMessage v-if="item.senderUserId !== profile.data.id" :text-message="item.textMessage"
          :latest-message-timestamp="item.latestMessageTimestamp" :status="item.status" :chat-id="chatRoom.chatId"
          :chat-room-id="chatRoom.chatRoomId" :message-id="item.messageId" />
      </template>
    </main>

    <FooterChatRoom />
  </div>
</template>
