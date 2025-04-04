<script setup>
import { usersStore } from '@/stores/users';
import FooterChatRoom from './FooterChatRoom.vue';
import HeaderChatRoom from './HeaderChatRoom.vue';
import SenderMessage from './SenderMessage.vue';
import RecipientMessage from './RecipientMessage.vue';
import { computed, nextTick, onBeforeUnmount, onMounted, onUnmounted, ref, watch } from 'vue';
import { socket } from '@/services/socket/socket';
// import SpamMessage from '@/spam-message/SpamMessage.vue';
import { useChatRoomStore } from '@/stores/chat-room';
import { storeToRefs } from 'pinia';
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller';

// store
// profile store
const userStore = usersStore()
const { profile, profileIdConnection } = userStore
// chat-room store
const chatRoomStore = useChatRoomStore()
const { chatRoom, isChatRoomStreamsDone } = storeToRefs(chatRoomStore)

// state
const scroller = ref(null)

// logic
const memoizedChatRoomId = computed(() => {
  return chatRoom.value?.chatRoomId
})
const memoizedChatId = computed(() => {
  return chatRoom.value?.chatId
})
const memoizedChatRoomData = computed(() => {
  return chatRoom.value?.data.slice().reverse()
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
  if (memoizedChatId.value) {
    socket.emit('leaveRoom', {
      chatRoomId: memoizedChatRoomId.value,
      chatId: memoizedChatId.value,
      userId: profile?.data.id
    })
  }
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

watch(memoizedChatRoomData, async (newMessages) => {
  if (newMessages.length > 0 && scroller.value) {
    await nextTick();
    setTimeout(() => {
      scroller.value.scrollToItem(newMessages.length - 1, {
        smooth: true,
        behavior: "smooth", // Efek scrolling halus
        offset: 100, // Jaga agar tidak kepotong
      });
    }, 50);
  }
});
</script>

<template>
  <!-- <SpamMessage /> -->
  <div class="flex flex-col h-screen border-l-[#f1f1f1] border-l-[1px]">
    <HeaderChatRoom :recipient-id="memoizedUserIds.filter(id => id !== profile.data.id)?.[0]"
      :profile-id="profile.data.id" :profile-id-connection="profileIdConnection" />

    <DynamicScroller ref="scroller" :items="memoizedChatRoomData" :min-item-size="54"
      class="flex-1 !p-4 space-y-2 bg-[#f9fafb]">
      <template v-slot="{ item, index, active }">
        <DynamicScrollerItem :item="item" :active="active" :size-dependencies="[
          item.textMessage,
        ]" :data-index="index" :key="item.messageId">
          <SenderMessage v-if="item.senderUserId === profile.data.id" :text-message="item.textMessage"
            :latest-message-timestamp="item.latestMessageTimestamp" :status="item.status"
            :message-id="item.messageId" />
          <RecipientMessage v-if="item.senderUserId !== profile.data.id" :text-message="item.textMessage"
            :latest-message-timestamp="item.latestMessageTimestamp" :status="item.status" :chat-id="memoizedChatId"
            :chat-room-id="memoizedChatRoomId" :message-id="item.messageId" />
        </DynamicScrollerItem>
      </template>
    </DynamicScroller>

    <FooterChatRoom />
  </div>
</template>
