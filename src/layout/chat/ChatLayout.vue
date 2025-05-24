<script setup>
// import
import ChatItem from '@/sections/chat/chat-item/ChatItem.vue';
import Header from '@/sections/chat/Header.vue';
import ListChat from '@/sections/chat/ListChat.vue';
import SearchMessenger from '@/sections/chat/SearchMessenger.vue'
import { socket } from '@/services/socket/socket';
import { chatsStore } from '@/stores/chats';
import { usersStore } from '@/stores/users';
import { storeToRefs } from 'pinia';
import { computed, markRaw, nextTick, onBeforeMount, onBeforeUnmount, onMounted, onUnmounted, ref, shallowRef, triggerRef, watch } from 'vue';
import { RecycleScroller } from 'vue-virtual-scroller';
import ChatLayoutWrapper from './ChatLayoutWrapper.vue';
import NoSearchResult from './NoSearchResult.vue';
import NoChats from './NoChats.vue';
import ChatProfileSkeleton from '@/sections/chat/chat-item/ChatProfileSkeleton.vue';
import { fetchChats } from '@/services/api/chats';

// store
// profile store
const userStore = usersStore()
const { profile } = storeToRefs(userStore)
// chats store
const chatStore = chatsStore()
const { setChats } = chatStore
const { chats } = storeToRefs(chatStore)

// state
const newMessateSocketUpdate = ref(null)
const newReadNotificationSocketUpdate = ref(null)
// const chatsEventSource = ref(null)
const scroller = ref(null)
const searchValue = shallowRef('')
const loadingChats = shallowRef(true)
const loadingNextChats = ref(false)
const firstLoadChats = ref(true)

// logic
const memoizedChats = computed(() => chats.value)
const searchMessengerData = computed(() => {
  if (!searchValue.value.trim()) {
    return memoizedChats.value
  }

  return memoizedChats.value.filter(chat =>
    chat?.latestMessage?.textMessage?.toLowerCase()?.includes(searchValue.value.toLowerCase()) ||
    chat?.username?.toLowerCase()?.includes(searchValue.value.toLowerCase())
  )
})

// function resetChatsEventSource() {
//   chatsEventSource.value.close()
//   chatsEventSource.value = null
// }

const handleGetChats = async () => {
  loadingChats.value = true
  const chatsData = await fetchChats(profile.value?.data.id)
  if (chatsData?.data?.length > 0) {
    const newChats = [...markRaw(memoizedChats.value), ...chatsData.data].filter((chat, index, self) =>
      index === self.findIndex(c => c.chatId === chat.chatId)
    ).sort((a, b) => {
      const a_currentLatestMessage = a?.latestMessage?.find(msg => msg?.userId === profile.value?.data.id)
      const b_currentLatestMessage = b?.latestMessage?.find(msg => msg?.userId === profile.value?.data.id)

      return a_currentLatestMessage?.latestMessageTimestamp > b_currentLatestMessage?.latestMessageTimestamp ? -1 : 1
    })
    setChats(newChats, true)
    loadingChats.value = false
  } else {
    loadingChats.value = false
    setChats([], true)
  }
}

// async function handleGetChats() {
//   chatsEventSource.value = new EventSource(
//     `${clientUrl}/chats?userId=${profile.value?.data.id}`,
//   )

//   chatsEventSource.value.onmessage = (event) => {
//     const message = JSON.parse(event.data)

//     if (message?.length) {
//       const chatIds = new Set()
//       const newChats = [...markRaw(memoizedChats.value), ...message].filter(item => {
//         if (chatIds.has(item.chatId)) {
//           return false; // Hilangkan duplikat
//         }
//         chatIds.add(item.chatId);
//         return true; // Pertahankan kemunculan pertama
//       });
//       setChats(newChats)
//     }
//     loadingChats.value = false
//   }

//   chatsEventSource.value.addEventListener('done', () => {
//     resetChatsEventSource()
//     loadingChats.value = false
//   })

//   chatsEventSource.value.addEventListener('error', (e) => {
//     console.error('Streaming error:', e)
//     resetChatsEventSource()
//     loadingChats.value = false
//   })
// }

// hooks rendering
onBeforeMount(() => {
  socket.on('newMessage', (data) => {
    newMessateSocketUpdate.value = data
  })

  socket.on('readNotification', (data) => {
    newReadNotificationSocketUpdate.value = data
  })
})

let previousScrollHeight = 0
let previousScrollTop = 0

const handleGetNextChats = async () => {
  if (loadingNextChats.value) return
  loadingNextChats.value = true
  const anchorChatId = searchMessengerData.value?.[searchMessengerData.value.length - 1]?.chatId
  if (!anchorChatId) return
  const chatsData = await fetchChats(profile.value?.data.id, anchorChatId)
  if (!chatsData?.data?.length) {
    loadingNextChats.value = false
    return
  }
  const newChats = [...markRaw(memoizedChats.value), ...chatsData.data].filter((chat, index, self) =>
    index === self.findIndex(c => c.chatId === chat.chatId)
  ).sort((a, b) => {
    const a_currentLatestMessage = a?.latestMessage?.find(msg => msg?.userId === profile.value?.data.id)
    const b_currentLatestMessage = b?.latestMessage?.find(msg => msg?.userId === profile.value?.data.id)

    return a_currentLatestMessage?.latestMessageTimestamp > b_currentLatestMessage?.latestMessageTimestamp ? -1 : 1
  })
  setChats(newChats, true)
  loadingNextChats.value = false
}

const handleScroll = () => {
  const el = scroller.value?.$el
  if (!el) return

  const scrollTop = scroller.value?.$el?.scrollTop ?? 0
  previousScrollTop = scrollTop
  previousScrollHeight = el.scrollHeight

  // console.log(el.scrollTop, el.scrollHeight, el.clientHeight)
  if (el.scrollTop + el.clientHeight >= el.scrollHeight) {
    // Scroll ke bawah
    handleGetNextChats()
  }
}

watch([searchMessengerData, scroller], async ([_, scroller]) => {
  await nextTick()
  await nextTick()
  await nextTick()
  if (!scroller || !firstLoadChats.value) {
    return
  }
  handleScroll()
  firstLoadChats.value = false
})

watch(scroller, (scroller) => {
  const el = scroller.$el

  if (!el) return

  el.addEventListener('scroll', handleScroll)
}, { once: true })

onUnmounted(() => {
  const el = scroller.value?.$el
  if (!el) return

  el.removeEventListener('scroll', handleScroll)
})

onBeforeMount(async () => {
  handleGetChats()
})

onMounted(() => {
  document.body.style.overflow = 'hidden'
})

onBeforeUnmount(() => {
  document.body.style.overflowY = 'auto'
})

const handleNewMessage = (data) => {
  const chatCurrently = markRaw(memoizedChats.value)?.find(chat => chat?.chatId === data?.chatId)
  // jika data ada di chats store
  // tinggal ubah datanya
  if (chatCurrently && !data?.isHeader) {
    const newChatUserCurrently = {
      ...chatCurrently,
      latestMessage: data.latestMessage,
      unreadCount: data.unreadCount,
      latestMessageTimestamp: data.latestMessage.latestMessageTimestamp
    }
    const removeChatUserCurrently = memoizedChats.value?.slice()?.filter(chat =>
      chat.chatId !== data?.chatId
    )
    setChats([
      newChatUserCurrently,
      ...removeChatUserCurrently
    ], true)
  } else if (
    !chatCurrently && data?.unreadCount?.[profile.value?.data.id] !== undefined &&
    !data?.isHeader
  ) {
    // jika belum ada di chats store
    // buat baru dan masukkan ke awal index
    const newUserChat = {
      ...data,
      latestMessageTimestamp: data.latestMessage?.latestMessageTimestamp,
      userIds: [Object.entries(data.unreadCount).find((k) => k[0] === profile.value?.data.id).find(id => id !== 0), Object.entries(data.unreadCount).find((k) => k[0] !== profile.value?.data.id).find(id => id !== 0)]
    }
    delete newUserChat.eventType
    chats.value.unshift(newUserChat)
    chats.value = markRaw([...chats.value]) // gunakan markRaw karena hanya replace data
    triggerRef(chats)
  }
}

const handleUpdateDeleteMessage = async (data) => {
  const indexChat = memoizedChats.value?.findIndex(chat => chat?.chatId === data?.chatId)
  if (indexChat === -1) {
    return
  }
  // Salin seluruh chats agar triggerRef bekerja
  const updatedChats = [...chats.value]

  if (!data?.latestMessage || data.latestMessage?.length === 0) {
    updatedChats[indexChat] = {
      ...updatedChats[indexChat],
      latestMessage: []
    }
    chats.value = updatedChats
    triggerRef(chats)
    return
  }

  // Ganti item chat dengan versi yang diperbarui
  updatedChats[indexChat] = {
    ...updatedChats[indexChat],
    latestMessage: data.latestMessage.map(message => {
      let newData = {
        ...message
      }
      if (message?.isDeleted) {
        newData.isDeleted = [...message.isDeleted]
      }
      return newData
    })
  }

  chats.value = updatedChats
  triggerRef(chats)
}

watch(newMessateSocketUpdate, (data) => {
  if (data.eventType === 'send-message') {
    handleNewMessage(data)
  } else if (data?.eventType === 'delete-message' && data?.isUpdatedLatestMessage) {
    handleUpdateDeleteMessage(data)
  }
})

watch(newReadNotificationSocketUpdate, (data) => {
  const chatUserIndex = markRaw(memoizedChats.value)?.findIndex(chat => chat?.chatId === data?.chatId)
  if (chatUserIndex !== -1) {
    chats.value[chatUserIndex] = {
      ...chats.value[chatUserIndex],
      unreadCount: data.unreadCount
    }
    chats.value = markRaw([...chats.value]) // gunakan markRaw karena hanya replace data
    triggerRef(chats)
  }
})
</script>

<template>
  <ChatLayoutWrapper>
    <Header :scroller="scroller">
      <template #search>
        <SearchMessenger v-model="searchValue" />
      </template>
    </Header>
    <ListChat>
      <template #list>
        <!-- loading chats -->
        <div v-if="loadingChats" class="flex-1 overflow-y-auto px-3 pb-3">
          <ChatProfileSkeleton />
          <ChatProfileSkeleton />
          <ChatProfileSkeleton />
        </div>

        <!-- no result search messenger -->
        <NoSearchResult v-if="searchValue.trim() && searchMessengerData.length === 0" />

        <!-- chat list -->
        <RecycleScroller v-if="!loadingChats && searchMessengerData.length > 0" ref="scroller" class="px-3 pb-3 flex-1"
          :items="searchMessengerData" :item-size="64" key-field="chatId" v-slot="{ item }" :key="item?.chatId">
          <ChatItem :item="item" :key="item.chatId" />
        </RecycleScroller>

        <!-- no chats -->
        <NoChats v-if="!loadingChats && !searchValue.trim() && searchMessengerData.length === 0" />
      </template>
    </ListChat>
  </ChatLayoutWrapper>
</template>
