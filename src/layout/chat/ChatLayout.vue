<script setup>
// import
import ChatItem from '@/sections/chat/chat-item/ChatItem.vue';
import Header from '@/sections/chat/Header.vue';
import ListChat from '@/sections/chat/ListChat.vue';
import SearchMessenger from '@/sections/chat/SearchMessenger.vue'
import { fetchChats } from '@/services/api/chats';
import { socket } from '@/services/socket/socket';
import { useChatRoomStore } from '@/stores/chat-room';
import { chatsStore } from '@/stores/chats';
import { usersStore } from '@/stores/users';
import { storeToRefs } from 'pinia';
import { onBeforeMount, onMounted, onUnmounted, ref, watch } from 'vue';
import { RecycleScroller } from 'vue-virtual-scroller';

// store
// profile store
const userStore = usersStore()
const { profile } = userStore
// chats store
const chatStore = chatsStore()
const { setChats } = chatStore
const { chats } = storeToRefs(chatStore)
// chat room store
const chatRoomStore = useChatRoomStore()
const { chatRoom } = storeToRefs(chatRoomStore)

// state
// worker state
const apiChatsWorker = ref(null)
const checkChatsWorker = ref(null)

const totalDataStreamsChats = ref(null)
const isStreamsDone = ref(false)
const newMessateSocketUpdate = ref(null)
const newReadNotificationSocketUpdate = ref(null)

// logic
async function handleGetChats() {
  if (profile?.data?.id) {
    // set worker to use on streams
    apiChatsWorker.value = new Worker(new URL('/src/services/workers/api-chats-worker.js', import.meta.url))

    fetchChats(
      profile.data.id,
      apiChatsWorker.value,
      // res data callback
      (res, isDone, totalData) => {
        // update total data
        if (totalData !== null) {
          totalDataStreamsChats.value = totalData
        }

        if (res?.length > 0 && !isDone) {
          // start check chats worker
          checkChatsWorker.value = new Worker(new URL('/src/services/workers/check-chats-worker.js', import.meta.url))

          // check new data chats from store & streams progress
          checkChatsWorker.value.postMessage({
            chats: chats.value.slice(),
            streams: res
          })

          // listen to check chats currently
          checkChatsWorker.value.onmessage = (event) => {
            setChats(event.data.chats)

            if (event.data.chats.length === totalDataStreamsChats.value) {
              isStreamsDone.value = true
            }
          }
        } else if (res?.length === 0 || !res) {
          isStreamsDone.value = true
          if (checkChatsWorker.value) {
            checkChatsWorker.value.terminate()
            checkChatsWorker.value = null
          }
          apiChatsWorker.value.terminate()
          apiChatsWorker.value = null
        }
      },
      // err callback
      () => {

      }
    )
  }
}

// hooks rendering
onBeforeMount(async () => {
  handleGetChats()
})

onMounted(() => {
  socket.on('newMessage', (data) => {
    newMessateSocketUpdate.value = data
  })

  socket.on('readNotification', (data) => {
    newReadNotificationSocketUpdate.value = data
  })
})

onUnmounted(() => {
  if (apiChatsWorker.value) {
    apiChatsWorker.value.terminate()
    checkChatsWorker.value?.terminate()
  }
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
  <div :class="`${chatRoom?.chatId ? 'hidden md:flex' : 'md:flex'} flex-col gap-2`">
    <Header>
      <template #search>
        <SearchMessenger />
      </template>
    </Header>
    <ListChat>
      <template #list>
        <ul>
          <RecycleScroller class="scroller" :items="chats" :item-size="64" key-field="chatId" v-slot="{ item }">
            <ChatItem :item="item" />
          </RecycleScroller>
        </ul>
      </template>
    </ListChat>
  </div>
</template>
