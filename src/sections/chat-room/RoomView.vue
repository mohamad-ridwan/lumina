<script setup>
import { usersStore } from '@/stores/users';
import FooterChatRoom from './FooterChatRoom.vue';
import HeaderChatRoom from './HeaderChatRoom.vue';
import SenderMessage from './SenderMessage.vue';
import RecipientMessage from './RecipientMessage.vue';
import { computed, onBeforeUnmount, onMounted, onUnmounted, ref } from 'vue';
import { socket } from '@/services/socket/socket';
// import SpamMessage from '@/spam-message/SpamMessage.vue';
import { useChatRoomStore } from '@/stores/chat-room';
import { storeToRefs } from 'pinia';
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller';
import { Button } from 'primevue';

// store
// profile store
const userStore = usersStore()
const { profile, profileIdConnection } = userStore
// chat-room store
const chatRoomStore = useChatRoomStore()
const { setChatRoomMessages } = chatRoomStore
const { chatRoom, chatRoomMessages } = storeToRefs(chatRoomStore)

// state
const scroller = ref(null)
const SCROLL_THRESHOLD = 200;
const showScrollDownButton = ref(false);

// logic
const memoizedChatRoomId = computed(() => {
  return chatRoom.value?.chatRoomId
})
const memoizedChatId = computed(() => {
  return chatRoom.value?.chatId
})
const memoizedChatRoomData = computed(() => {
  // return chatRoomMessages.value?.slice().reverse()
  return chatRoomMessages.value?.slice()
})
const memoizedUserIds = computed(() => {
  return chatRoom.value?.userIds
})

const scrollToBottom = () => {
  if (scroller.value) {
    // Karena tampilan dibalik, scroll ke 0 akan membawa ke bagian "bawah" (pesan terbaru)
    scroller.value.scrollToItem(0);
    showScrollDownButton.value = false;
  }
};
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

// watch(memoizedChatRoomData, async (newMessages) => {
//   if (newMessages.length > 0 && scroller.value) {
//     await nextTick();
//     scroller.value.scrollToItem(newMessages.length - 1, {
//       smooth: true,
//       behavior: "smooth",
//     });
//   }
// });

onMounted(() => {
  const el = scroller.value?.$el; // atau scroller container

  if (el) {
    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      el.scrollTop -= e.deltaY;
    }, { passive: false });
  }
})

const handleScroll = () => {
  if (scroller.value?.$el) {
    const scrollTop = scroller.value.$el.scrollTop;
    showScrollDownButton.value = scrollTop > SCROLL_THRESHOLD;
  }
};

onMounted(() => {
  // Tambahkan event listener untuk scroll
  scroller.value?.$el.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
  setChatRoomMessages([])
})
</script>

<template>
  <!-- <SpamMessage /> -->
  <div class="flex flex-col h-screen border-l-[#f1f1f1] border-l-[1px]">
    <HeaderChatRoom :recipient-id="memoizedUserIds.filter(id => id !== profile.data.id)?.[0]"
      :profile-id="profile.data.id" :profile-id-connection="profileIdConnection" />

    <DynamicScroller ref="scroller" :items="memoizedChatRoomData" :min-item-size="54"
      class="flex-1 !p-4 space-y-2 bg-[#f9fafb]"
      style="display: flex; flex-direction: column; transform: rotate(180deg); direction: rtl;">
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

    <Button v-if="showScrollDownButton" @click="scrollToBottom"
      class="!absolute !bottom-24 !right-4 !bg-white !h-[2rem] !w-[2rem] !shadow !rounded-full !transition-opacity !duration-300 !ease-in-out !border-none"
      :class="{ '!opacity-100': showScrollDownButton, '!opacity-0 pointer-events-none': !showScrollDownButton }"
      aria-label="Scroll to bottom" icon="pi pi-arrow-down !text-black !text-sm" iconPos="only" />

    <FooterChatRoom />
  </div>
</template>
