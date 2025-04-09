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
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import isToday from 'dayjs/plugin/isToday';
import isYesterday from 'dayjs/plugin/isYesterday';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import weekday from 'dayjs/plugin/weekday';
import DateHeader from './DateHeader.vue';
import { generateRandomId } from '@/helpers/generateRandomId';

dayjs.extend(isToday);
dayjs.extend(isYesterday);
dayjs.extend(weekOfYear);
dayjs.extend(weekday);

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
// const memoizedChatRoomData = computed(() => {
//   return chatRoomMessages.value?.slice()
// })
const memoizedChatRoomDataWithHeaders = computed(() => {
  if (!chatRoomMessages.value) {
    return [];
  }

  const groupedMessages = new Map();

  for (const item of chatRoomMessages.value) {
    const itemDate = dayjs(Number(item.latestMessageTimestamp)).startOf('day');
    const formattedDate = formatDate(itemDate);

    if (!groupedMessages.has(formattedDate)) {
      groupedMessages.set(formattedDate, { date: itemDate, items: [] });
    }
    groupedMessages.get(formattedDate)?.items.push(item);
  }

  const result = [];
  for (const [formattedDate, group] of groupedMessages) {
    result.push(...group.items); // push messages first
    const messageId = generateRandomId(15)
    result.push({
      id: messageId,
      messageId: messageId,
      isHeader: true,
      headerText: formattedDate,
      messageId: `header-${formattedDate}`
    }); // then push header
  }

  return result;
});

const formatDate = (date) => {
  const today = dayjs().startOf('day');
  const yesterday = dayjs().subtract(1, 'day').startOf('day');
  const now = dayjs();
  const dateToCheck = dayjs(date);

  if (dateToCheck.isSame(today, 'day')) {
    return 'Today';
  } else if (dateToCheck.isSame(yesterday, 'day')) {
    return 'Yesterday';
  } else if (dateToCheck.isSame(now, 'week') && !dateToCheck.isSame(today, 'day') && !dateToCheck.isSame(yesterday, 'day')) {
    return dateToCheck.format('dddd');
  } else {
    return dateToCheck.format('DD MMMM YYYY');
  }
};
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

// ini tetap diberikan karena mungkin nanti ada view component lain
// dan begitu posisi ada di chat room, dan mau ke view component tersebut udah dipastikan leave room
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

  // ini tetap diberikan karena mungkin nanti ada view component lain
  // dan begitu posisi ada di chat room, dan mau ke view component tersebut udah dipastikan leave room
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

    <DynamicScroller ref="scroller" :items="memoizedChatRoomDataWithHeaders" :min-item-size="54"
      class="flex-1 !p-4 space-y-2 bg-[#f9fafb]"
      style="display: flex; flex-direction: column; transform: rotate(180deg); direction: rtl;">
      <template v-slot="{ item, index, active }">
        <DateHeader v-if="item?.isHeader" :date="item.headerText" />
        <DynamicScrollerItem :item="item" :active="active" :size-dependencies="[
          item.textMessage,
        ]" :data-index="index" :key="item.messageId">
          <SenderMessage v-if="!item?.isHeader && item.senderUserId === profile.data.id"
            :text-message="item.textMessage" :latest-message-timestamp="item.latestMessageTimestamp"
            :status="item.status" :message-id="item.messageId" />
          <RecipientMessage v-if="!item?.isHeader && item.senderUserId !== profile.data.id"
            :text-message="item.textMessage" :latest-message-timestamp="item.latestMessageTimestamp"
            :status="item.status" :chat-id="memoizedChatId" :chat-room-id="memoizedChatRoomId"
            :message-id="item.messageId" />

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

<style scoped>
.dynamic-scroller>div.vue-recycle-scroller__slot {
  position: sticky;
  bottom: 6rem;
  z-index: 1;
}

.dynamic-scroller>div.vue-recycle-scroller__slot:first-child {
  position: sticky;
  top: 6rem;
  z-index: 1;
}
</style>
