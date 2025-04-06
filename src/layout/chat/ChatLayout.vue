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
import { markRaw, onBeforeMount, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { RecycleScroller } from 'vue-virtual-scroller';
import ChatLayoutWrapper from './ChatLayoutWrapper.vue';
import { clientUrl } from '@/services/apiBaseUrl';

// store
// profile store
const userStore = usersStore()
const { profile } = userStore
// chats store
const chatStore = chatsStore()
const { setChats } = chatStore
const { chats } = storeToRefs(chatStore)

// state
const newMessateSocketUpdate = ref(null)
const newReadNotificationSocketUpdate = ref(null)
const chatsEventSource = ref(null)

// logic
function resetChatsEventSource() {
  chatsEventSource.value.close()
  chatsEventSource.value = null
}

async function handleGetChats() {
  chatsEventSource.value = new EventSource(
    `${clientUrl}/chats?userId=${profile.data.id}`,
  )

  chatsEventSource.value.onmessage = (event) => {
    const message = JSON.parse(event.data)

    if (message?.length) {
      const chatIds = new Set()
      const chatsCurrently = [...markRaw(chats.value), ...markRaw(message)]
      const newChats = chatsCurrently.filter(item => {
        if (chatIds.has(item.chatId)) {
          return false; // Hilangkan duplikat
        }
        chatIds.add(item.chatId);
        return true; // Pertahankan kemunculan pertama
      });
      setChats(newChats)
    }
  }

  chatsEventSource.value.addEventListener('done', () => {
    resetChatsEventSource()
  })

  chatsEventSource.value.addEventListener('error', (e) => {
    console.error('Streaming error:', e)
    resetChatsEventSource()
  })
}

// hooks rendering
onBeforeMount(async () => {
  handleGetChats()
})

onMounted(() => {
  document.body.style.overflow = 'hidden'

  socket.on('newMessage', (data) => {
    newMessateSocketUpdate.value = data
  })

  socket.on('readNotification', (data) => {
    newReadNotificationSocketUpdate.value = data
  })
})

onBeforeUnmount(() => {
  document.body.style.overflowY = 'auto'
})

watch(newMessateSocketUpdate, (data) => {
  const chatCurrently = chats.value?.slice()?.find(chat => chat?.chatId === data?.chatId)
  // jika data ada di chats store
  // tinggal ubah datanya
  if (chatCurrently && data.eventType === 'send-message') {
    const newChatUserCurrently = {
      ...chatCurrently,
      latestMessage: data.latestMessage,
      unreadCount: data.unreadCount,
      latestMessageTimestamp: data.latestMessage.latestMessageTimestamp
    }
    const removeChatUserCurrently = chats.value?.slice()?.filter(chat =>
      chat.chatId !== data?.chatId
    )
    setChats([
      newChatUserCurrently,
      ...removeChatUserCurrently
    ])
  } else if (
    !chatCurrently && data.eventType === 'send-message' &&
    data?.unreadCount?.[profile.data.id] !== undefined
  ) {
    // jika belum ada di chats store
    // buat baru dan masukkan ke awal index
    const newUserChat = {
      ...data,
      latestMessageTimestamp: data.latestMessage?.latestMessageTimestamp,
      userIds: [Object.entries(data.unreadCount).find((k) => k[0] === profile.data.id).find(id => id !== 0), Object.entries(data.unreadCount).find((k) => k[0] !== profile.data.id).find(id => id !== 0)]
    }
    delete newUserChat.eventType
    setChats([
      newUserChat,
      ...chats?.value?.slice() ?? []
    ])
  }
})

watch(newReadNotificationSocketUpdate, (data) => {
  const chatUserIndex = chats.value?.slice()?.findIndex(chat => chat?.chatId === data?.chatId)
  if (chatUserIndex !== -1) {
    let newChats = chats.value?.slice()
    newChats[chatUserIndex].unreadCount = {
      ...data.unreadCount
    }
    setChats(newChats)
  }
})
</script>

<template>
  <ChatLayoutWrapper>
    <Header>
      <template #search>
        <SearchMessenger />
      </template>
    </Header>
    <ListChat>
      <template #list>
        <RecycleScroller class="px-3 pb-3 flex-1" :items="chats" :item-size="64" key-field="chatId" v-slot="{ item }">
          <ChatItem :item="item" />
        </RecycleScroller>
      </template>
    </ListChat>
  </ChatLayoutWrapper>
</template>
