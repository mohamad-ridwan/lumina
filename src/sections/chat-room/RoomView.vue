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
const headerRefs = ref({})
const observer = ref(null)
const currentStickyHeader = ref({
  latestMessageTimestamp: 0,
  text: ''
})

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
    const messages = group.items;

    if (!messages.length) continue;
    const lastMessage = messages[messages.length - 1];

    // Tambahkan pesan-pesan
    result.push(...messages);

    // Tambahkan header terakhir (untuk penanda grouping)
    const endMessageId = generateRandomId(15);
    result.push({
      id: endMessageId,
      messageId: endMessageId,
      isHeader: true,
      isEndHeader: true,
      headerText: formattedDate,
      latestMessageTimestamp: lastMessage.latestMessageTimestamp, // akhir grup
    });
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

function setHeaderRef(el, item) {
  if (!item?.latestMessageTimestamp) return

  const key = item.id // bisa juga pakai uniqueKey kalau ada
  if (el) {
    headerRefs.value[key] = el
  } else {
    delete headerRefs.value[key]
  }
}

const onScroll = () => {
  const containerRect = scroller.value?.$el?.getBoundingClientRect()
  if (!containerRect) return

  const containerBottom = containerRect.bottom // karena rotate 180
  const itemElements = Object.values(headerRefs.value || {}) // semua item, bukan cuma header

  let closestItem = null
  let minDistance = Infinity

  itemElements.forEach((el) => {
    const rect = el.getBoundingClientRect()
    const visualBottom = rect.bottom + 580
    const distance = Math.abs(visualBottom - containerBottom)

    const isAboveViewport = visualBottom <= containerBottom - 30
    const timestamp = Number(el.dataset.timestamp)

    if (isAboveViewport && distance < minDistance && !isNaN(timestamp)) {
      minDistance = distance
      closestItem = { timestamp, el }
    }
  })

  if (closestItem && closestItem.timestamp !== currentStickyHeader.value.latestMessageTimestamp) {
    const itemDate = dayjs(closestItem.timestamp).startOf('day')
    currentStickyHeader.value = {
      latestMessageTimestamp: closestItem.timestamp,
      text: formatDate(itemDate),
    }
  }
}

watch(() => memoizedChatRoomDataWithHeaders.value, (data) => {
  if (data.length === 0) {
    currentStickyHeader.value = {
      latestMessageTimestamp: 0,
      text: ''
    }
    headerRefs.value = {}
  }
  nextTick(() => {
    Object.values(headerRefs.value).forEach((el) => {
      if (el) observer.value?.observe(el)
    })
    onScroll()
  })
})

watch(
  () => scroller.value,
  () => {
    onScroll()
  },
  { immediate: true }
)

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
    nextTick(() => {
      onScroll()
    })
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
  <div class="flex flex-col h-screen border-l-[#f1f1f1] border-l-[1px] relative">
    <HeaderChatRoom :recipient-id="memoizedUserIds.filter(id => id !== profile.data.id)?.[0]"
      :profile-id="profile.data.id" :profile-id-connection="profileIdConnection" />

    <div v-if="currentStickyHeader.text"
      class="absolute top-20 z-10 rotate-180 flex justify-center items-center w-full">
      <DateHeader :date="currentStickyHeader.text" />
    </div>

    <DynamicScroller id="scrollChatRoom" ref="scroller" :items="memoizedChatRoomDataWithHeaders" :min-item-size="54"
      class="flex-1 !p-4 space-y-2 bg-[#f9fafb]" :buffer="0" :page-mode="false"
      style="display: flex; flex-direction: column; transform: rotate(180deg); direction: rtl;">
      <template v-slot="{ item, index, active }">
        <DynamicScrollerItem :item="item" :active="active" :size-dependencies="[
          item.textMessage,
        ]" :data-index="index" :key="item.messageId">
          <div v-if="item?.isHeader">
            <DateHeader v-if="item?.isEndHeader" :date="item.headerText" />
          </div>
          <div :id="`${item.id}-${item.latestMessageTimestamp}`" :ref="(el) => setHeaderRef(el, item)"
            :data-timestamp="item.latestMessageTimestamp">
            <SenderMessage v-if="!item?.isHeader && item.senderUserId === profile.data.id"
              :text-message="item.textMessage" :latest-message-timestamp="item.latestMessageTimestamp"
              :status="item.status" :message-id="item.messageId" />
          </div>
          <div :id="`${item.id}-${item.latestMessageTimestamp}`" :ref="(el) => setHeaderRef(el, item)"
            :data-timestamp="item.latestMessageTimestamp">
            <RecipientMessage v-if="!item?.isHeader && item.senderUserId !== profile.data.id"
              :text-message="item.textMessage" :latest-message-timestamp="item.latestMessageTimestamp"
              :status="item.status" :chat-id="memoizedChatId" :chat-room-id="memoizedChatRoomId"
              :message-id="item.messageId" />
          </div>
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
