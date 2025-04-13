<script setup>
import { usersStore } from '@/stores/users';
import FooterChatRoom from './FooterChatRoom.vue';
import HeaderChatRoom from './HeaderChatRoom.vue';
import SenderMessage from './SenderMessage.vue';
import RecipientMessage from './RecipientMessage.vue';
import { computed, nextTick, onBeforeUnmount, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue';
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
import UserTypingIndicator from './UserTypingIndicator.vue';
import SkeletonMessages from './SkeletonMessages.vue';

dayjs.extend(isToday);
dayjs.extend(isYesterday);
dayjs.extend(weekOfYear);
dayjs.extend(weekday);

// store
// profile store
const userStore = usersStore()
const { profile, profileIdConnection } = storeToRefs(userStore)
// chat-room store
const chatRoomStore = useChatRoomStore()
const { setChatRoomMessages } = chatRoomStore
const { chatRoom, chatRoomMessages, loadingMessages } = storeToRefs(chatRoomStore)

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
const showDateHeader = shallowRef(false)
const typingStartSocketUpdate = shallowRef({
  key: 0,
  senderId: null,
  recipientId: null
})
const typingStopSocketUpdate = shallowRef({
  key: 0,
  senderId: null,
  recipientId: null
})
// const memoizedChatRoomDataWithHeaders = ref([]);
const anyUserTyping = shallowRef(false)
const isUserInitiatedScroll = shallowRef(false)
const scrollTimeout = shallowRef(null)
const scrollTimeOutDateHeader = shallowRef(null)
const footerHeight = shallowRef(null)

// logic
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

const memoizedChatRoomId = computed(() => {
  return chatRoom.value?.chatRoomId
})
const memoizedChatId = computed(() => {
  return chatRoom.value?.chatId
})
const memoizedMessages = computed(() => {
  if (!chatRoomMessages.value) {
    return []
  }

  if (anyUserTyping.value) {
    return [{
      id: 'typing',
      messageId: 'typing',
      isTyping: true
    }, ...chatRoomMessages.value?.map(chat => {
      if (chat?.isHeader) {
        return { ...chat, headerText: formatDate(Number(chat?.latestMessageTimestamp)) }
      }
      return chat
    })]
  }

  return chatRoomMessages.value?.map(chat => {
    if (chat?.isHeader) {
      return { ...chat, headerText: formatDate(Number(chat?.latestMessageTimestamp)) }
    }
    return chat
  })
})
const memoizedUserIds = computed(() => {
  return chatRoom.value?.userIds
})
const memoizedUserIdCurrently = computed(() => {
  return memoizedUserIds.value?.find(id => id !== profile.value?.data.id)
})

const handleGetFooterHeight = (height) => {
  footerHeight.value = height + 10
}

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
    const visualBottom = rect.bottom
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

watch(chatRoomMessages, (data) => {
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
}, { immediate: true })

watch(
  () => scroller.value,
  () => {
    nextTick(() => {
      onScroll()
    })
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

watch(loadingMessages, (loading) => {
  if (loading) {
    showScrollDownButton.value = false
  }
}, { immediate: true })

watch(loadingMessages, async (loading) => {
  if (loading) return
  await nextTick()

  const el = scroller.value?.$el; // atau scroller container

  if (el) {
    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      el.scrollTop -= e.deltaY;
    }, { passive: false });
  }
})

const markUserScroll = () => {
  isUserInitiatedScroll.value = true
  // Reset otomatis dalam beberapa ms
  clearTimeout(scrollTimeout.value)
  scrollTimeout.value = setTimeout(() => {
    isUserInitiatedScroll.value = false
  }, 100)
}

const scrollStop = () => {
  clearTimeout(scrollTimeOutDateHeader.value)
  if (showDateHeader.value) {
    scrollTimeOutDateHeader.value = setTimeout(() => {
      showDateHeader.value = false
    }, 500);
  }
}

const handleScroll = () => {
  const scrollTop = scroller.value?.$el?.scrollTop ?? 0

  if (isUserInitiatedScroll.value) {
    showDateHeader.value = true
    nextTick(() => {
      onScroll()
    })
    showScrollDownButton.value = scrollTop > SCROLL_THRESHOLD
  } else if (scrollTop === 0) {
    showScrollDownButton.value = scrollTop > SCROLL_THRESHOLD
  }
  scrollStop()
}

watch(loadingMessages, async (loading) => {
  if (loading) return

  await nextTick()

  const el = scroller.value?.$el
  if (!el) return

  // Tangkap gesture dari user
  el.addEventListener('wheel', markUserScroll, { passive: true })
  el.addEventListener('touchstart', markUserScroll, { passive: true })
  el.addEventListener('touchmove', markUserScroll, { passive: true })
  el.addEventListener('pointerdown', markUserScroll, { passive: true })

  // Scroll listener
  el.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  const el = scroller.value?.$el
  if (!el) return

  el.removeEventListener('wheel', markUserScroll)
  el.removeEventListener('touchstart', markUserScroll)
  el.removeEventListener('touchmove', markUserScroll)
  el.removeEventListener('pointerdown', markUserScroll)
  el.removeEventListener('scroll', handleScroll)
})

onMounted(() => {
  socket.on('typing-start', (data) => {
    typingStartSocketUpdate.value = {
      ...data,
      key: typingStartSocketUpdate.value.key + 1
    }
  })
})

onMounted(() => {
  socket.on('typing-stop', (data) => {
    typingStopSocketUpdate.value = {
      ...data,
      key: typingStopSocketUpdate.value.key + 1
    }
  })
})

watch(typingStartSocketUpdate, (data) => {
  if (data?.senderId === memoizedUserIdCurrently.value && data?.recipientId === profile.value?.data?.id) {
    anyUserTyping.value = true
  }
})

watch(typingStopSocketUpdate, (data) => {
  if (data?.senderId === memoizedUserIdCurrently.value && data?.recipientId === profile.value?.data?.id) {
    anyUserTyping.value = false
  }
})

onUnmounted(() => {
  loadingMessages.value = false
  setChatRoomMessages([])
})
</script>

<template>
  <!-- <SpamMessage v-once /> -->
  <div class="flex flex-col flex-1 overflow-hidden relative bg-[#f9fafb] border-l border-[#f1f1f1]">
    <HeaderChatRoom :recipient-id="memoizedUserIds.filter(id => id !== profile.data.id)?.[0]"
      :profile-id="profile.data.id" :profile-id-connection="profileIdConnection" />

    <div v-if="currentStickyHeader.text"
      :class="`absolute top-22 z-10 rotate-180 flex justify-center items-center w-full ${showDateHeader ? 'opacity-100' : 'opacity-0'} transition-all`">
      <DateHeader :date="currentStickyHeader.text" />
    </div>

    <SkeletonMessages v-if="loadingMessages" />

    <DynamicScroller v-if="!loadingMessages" id="scrollChatRoom" ref="scroller" :items="memoizedMessages"
      :min-item-size="54" class="flex-1 space-y-2 bg-[#f9fafb] !p-4"
      style="display: flex; flex-direction: column; transform: rotate(180deg); direction: rtl;">
      <template v-slot="{ item, index, active }">
        <DynamicScrollerItem :item="item" :active="active" :size-dependencies="[
          item.textMessage,
        ]" :data-index="index" :key="item.messageId">
          <div v-if="item?.isHeader">
            <DateHeader :date="item.headerText" />
          </div>
          <div :id="`${item.id}-${item.latestMessageTimestamp}`" :ref="(el) => setHeaderRef(el, item)"
            :data-timestamp="item.latestMessageTimestamp">
            <SenderMessage v-if="item?.textMessage && item.senderUserId === profile.data.id"
              :text-message="item.textMessage" :latest-message-timestamp="item.latestMessageTimestamp"
              :status="item.status" :message-id="item.messageId" />
          </div>
          <div :id="`${item.id}-${item.latestMessageTimestamp}`" :ref="(el) => setHeaderRef(el, item)"
            :data-timestamp="item.latestMessageTimestamp">
            <RecipientMessage v-if="item?.textMessage && item.senderUserId !== profile.data.id"
              :text-message="item.textMessage" :latest-message-timestamp="item.latestMessageTimestamp"
              :status="item.status" :chat-id="memoizedChatId" :chat-room-id="memoizedChatRoomId"
              :message-id="item.messageId" />
          </div>
          <div v-if="item?.isTyping">
            <UserTypingIndicator />
          </div>
        </DynamicScrollerItem>
      </template>
    </DynamicScroller>

    <Button @click="scrollToBottom"
      class="!absolute !right-4 !bg-white !h-[2rem] !w-[2rem] !shadow !rounded-full !duration-300 !ease-in-out !border-none !transition-all"
      :class="{ '!opacity-100': showScrollDownButton, '!opacity-0 pointer-events-none': !showScrollDownButton }"
      :style="`bottom: ${footerHeight}px;`" aria-label="Scroll to bottom" icon="pi pi-arrow-down !text-black !text-sm"
      iconPos="only" />

    <FooterChatRoom v-on:handle-get-footer-height="handleGetFooterHeight" />
  </div>
</template>
