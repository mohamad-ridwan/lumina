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
const { chats, searchMessengerData } = storeToRefs(chatStore)

// state
const newMessateSocketUpdate = ref(null)
const newReadNotificationSocketUpdate = ref(null)
// const chatsEventSource = ref(null)
const scroller = ref(null)
const searchValue = shallowRef('')
const loadingChats = shallowRef(true)
const loadingNextChats = ref(false)
const firstLoadChats = ref(true)
const loadingSearch = ref(false)
const isNextSearchMessengerData = ref(true)
const isNextChatsOnResize = ref(true)

// logic
const memoizedChats = computed(() => chats.value)
const memoizedChatsCurrently = computed(() => {
  // if (!searchMessengerData.value.length) {
  //   return memoizedChats.value
  // }
  return searchMessengerData.value
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
    searchMessengerData.value = newChats
    triggerRef(searchMessengerData)
    loadingChats.value = false
  } else {
    loadingChats.value = false
    setChats([], true)
    searchMessengerData.value = []
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

const handleGetNextChats = async (getNextSearchMessengerData, onResize) => {
  if (loadingNextChats.value || (!isNextChatsOnResize.value && onResize)) return
  loadingNextChats.value = true
  const anchorChatId = memoizedChatsCurrently.value?.[memoizedChatsCurrently.value.length - 1]?.chatId
  if (!anchorChatId) return
  const chatsData = await fetchChats(profile.value?.data.id, anchorChatId, searchValue.value.trim() || undefined)
  if (onResize && chatsData?.isNext === false) {
    isNextChatsOnResize.value = false
  } else if (onResize && chatsData?.isNext === true) {
    isNextChatsOnResize.value = true
  }
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

  const newSearchMessenger = [...markRaw(memoizedChatsCurrently.value), ...chatsData.data].filter((chat, index, self) =>
    index === self.findIndex(c => c.chatId === chat.chatId)
  ).sort((a, b) => {
    const a_currentLatestMessage = a?.latestMessage?.find(msg => msg?.userId === profile.value?.data.id)
    const b_currentLatestMessage = b?.latestMessage?.find(msg => msg?.userId === profile.value?.data.id)

    return a_currentLatestMessage?.latestMessageTimestamp > b_currentLatestMessage?.latestMessageTimestamp ? -1 : 1
  })
  searchMessengerData.value = newSearchMessenger
  triggerRef(searchMessengerData)
  loadingNextChats.value = false
  if (getNextSearchMessengerData && chatsData?.isNext === true && searchValue.value.trim()) {
    isNextSearchMessengerData.value = true
  } else if (getNextSearchMessengerData) {
    isNextSearchMessengerData.value = false
  }
  if (chatsData?.isNext === true) {
    await nextTick()
    await nextTick()
    await nextTick()
    handleScroll()
  }
}

const handleScroll = (getNextSearchMessengerData, onResize) => {
  const el = scroller.value?.$el
  if (!el) return

  // console.log(el.scrollTop, el.scrollHeight, el.clientHeight)
  if (el.scrollTop + el.clientHeight >= el.scrollHeight) {
    // Scroll ke bawah
    handleGetNextChats(getNextSearchMessengerData, onResize)
  }
}

watch([memoizedChatsCurrently, isNextSearchMessengerData, loadingSearch, searchValue], async ([_, isNextSearchMessengerData, loadingSearch, searchValue]) => {
  if (searchValue.trim() && isNextSearchMessengerData && !loadingSearch) {
    await nextTick()
    await nextTick()
    await nextTick()

    handleScroll(true)
  }
})

watch([memoizedChatsCurrently, scroller], async ([_, scroller]) => {
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
  window.addEventListener('resize', () => handleScroll(false, true))
}, { once: true })

let searchTimeout = null

watch(searchValue, async (search) => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  if (search.trim() === '') {
    searchMessengerData.value = chats.value
    triggerRef(searchMessengerData)
    loadingSearch.value = false
    return
  }
  loadingSearch.value = true
  searchTimeout = setTimeout(async () => {
    if (search.trim()) {
      const searchResult = await fetchChats(profile.value?.data.id, null, search)
      if (searchResult?.data?.length > 0) {
        searchMessengerData.value = searchResult.data
        searchMessengerData.value = [...searchMessengerData.value]
        triggerRef(searchMessengerData)
        loadingSearch.value = false
      } else {
        searchMessengerData.value = []
        loadingSearch.value = false
      }
    } else {
      loadingSearch.value = false
      searchMessengerData.value = chats.value
      triggerRef(searchMessengerData)
    }
  }, 500)
})

onUnmounted(() => {
  const el = scroller.value?.$el
  if (!el) return

  el.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', handleScroll)
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
      // latestMessageTimestamp: data.latestMessage.latestMessageTimestamp
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
      // latestMessageTimestamp: data.latestMessage?.latestMessageTimestamp,
      userIds: [Object.entries(data.unreadCount).find((k) => k[0] === profile.value?.data.id).find(id => id !== 0), Object.entries(data.unreadCount).find((k) => k[0] !== profile.value?.data.id).find(id => id !== 0)]
    }
    delete newUserChat.eventType
    chats.value.unshift(newUserChat)
    chats.value = markRaw([...chats.value]) // gunakan markRaw karena hanya replace data
    triggerRef(chats)
  }
}

const handleNewMessageSearchMessenger = (data) => {
  const chatCurrently = markRaw(memoizedChatsCurrently.value)?.find(chat => chat?.chatId === data?.chatId)
  // jika data ada di chats store
  // tinggal ubah datanya
  if (chatCurrently && !data?.isHeader) {
    const newChatUserCurrently = {
      ...chatCurrently,
      latestMessage: data.latestMessage,
      unreadCount: data.unreadCount,
      // latestMessageTimestamp: data.latestMessage.latestMessageTimestamp
    }
    const removeChatUserCurrently = memoizedChatsCurrently.value?.slice()?.filter(chat =>
      chat.chatId !== data?.chatId
    )
    searchMessengerData.value = [newChatUserCurrently, ...removeChatUserCurrently]
    triggerRef(searchMessengerData)
  } else if (
    !chatCurrently && data?.unreadCount?.[profile.value?.data.id] !== undefined &&
    !data?.isHeader
  ) {
    if (searchValue.value.trim()) {
      if (data?.recipientProfileId !== profile.value?.data.id) {
        return
      }
      const latestMessageCurrently = data.latestMessage?.find(msg => msg?.userId === profile.value?.data.id)

      const inSearch = data?.username?.toLowerCase().includes(searchValue.value.toLowerCase()) ||
        (latestMessageCurrently && latestMessageCurrently?.textMessage?.toLowerCase().includes(searchValue.value.toLowerCase())) ||
        (latestMessageCurrently && latestMessageCurrently?.document?.caption?.toLowerCase().includes(searchValue.value.toLowerCase()))

      if (!inSearch) {
        return
      }
    }

    // jika belum ada di chats store
    // buat baru dan masukkan ke awal index
    const newUserChat = {
      ...data,
      // latestMessageTimestamp: data.latestMessage?.latestMessageTimestamp,
      userIds: [Object.entries(data.unreadCount).find((k) => k[0] === profile.value?.data.id).find(id => id !== 0), Object.entries(data.unreadCount).find((k) => k[0] !== profile.value?.data.id).find(id => id !== 0)]
    }
    delete newUserChat.eventType
    searchMessengerData.value.unshift(newUserChat)
    searchMessengerData.value = markRaw([...searchMessengerData.value]) // gunakan markRaw karena hanya replace data
    triggerRef(searchMessengerData)
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

const handleUpdateDeleteSearchMessenger = (data) => {
  const indexChat = memoizedChatsCurrently.value?.findIndex(chat => chat?.chatId === data?.chatId)
  if (indexChat === -1) {
    return
  }
  // Salin seluruh chats agar triggerRef bekerja
  const updatedChats = [...searchMessengerData.value]

  if (!data?.latestMessage || data.latestMessage?.length === 0) {
    updatedChats[indexChat] = {
      ...updatedChats[indexChat],
      latestMessage: []
    }
    searchMessengerData.value = updatedChats
    triggerRef(searchMessengerData)
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

  searchMessengerData.value = updatedChats
  triggerRef(searchMessengerData)
}

watch(newMessateSocketUpdate, (data) => {
  if (data.eventType === 'send-message') {
    handleNewMessage(data)
    handleNewMessageSearchMessenger(data)
  } else if (data?.eventType === 'delete-message' && data?.isUpdatedLatestMessage) {
    handleUpdateDeleteMessage(data)
    handleUpdateDeleteSearchMessenger(data)
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

  const searchMessageUserIndex = markRaw(memoizedChatsCurrently.value)?.findIndex(chat => chat?.chatId === data?.chatId)
  if (searchMessageUserIndex !== -1) {
    searchMessengerData.value[searchMessageUserIndex] = {
      ...searchMessengerData.value[searchMessageUserIndex],
      unreadCount: data.unreadCount
    }
    searchMessengerData.value = markRaw([...searchMessengerData.value]) // gunakan markRaw karena hanya replace data
    triggerRef(searchMessengerData)
  }
})
</script>

<template>
  <ChatLayoutWrapper>
    <Header :scroller="scroller">
      <template #search>
        <SearchMessenger v-model="searchValue" :icon="loadingSearch ? 'pi-spin pi-spinner' : undefined" />
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
        <NoSearchResult v-if="searchValue.trim() && !loadingSearch && searchMessengerData.length === 0" />

        <!-- chat list -->
        <RecycleScroller v-if="!loadingChats && memoizedChats.length > 0" ref="scroller" class="px-3 pb-3 flex-1"
          :items="memoizedChatsCurrently" :item-size="64" key-field="chatId" v-slot="{ item }" :key="item?.chatId">
          <ChatItem :item="item" :key="item.chatId" />
        </RecycleScroller>

        <!-- no chats -->
        <NoChats v-if="!loadingChats && !searchValue.trim() && memoizedChats.length === 0" />
      </template>
    </ListChat>
  </ChatLayoutWrapper>
</template>
