<script setup>
// import
import ChatItem from '@/sections/chat/chat-item/ChatItem.vue';
import Header from '@/sections/chat/Header.vue';
import ListChat from '@/sections/chat/ListChat.vue';
import SearchMessenger from '@/sections/chat/SearchMessenger.vue'
import { fetchChats } from '@/services/api/chats';
import { socket } from '@/services/socket/socket';
import { chatsStore } from '@/stores/chats';
import { usersStore } from '@/stores/users';
import { storeToRefs } from 'pinia';
import { onBeforeMount, onMounted, onUnmounted, ref } from 'vue';

// store
// profile store
const userStore = usersStore()
const { profile } = userStore
// chats store
const chatStore = chatsStore()
const { setChats } = chatStore
const { chats } = storeToRefs(chatStore)

// state
// worker state
const apiChatsWorker = ref(null)
const checkChatsWorker = ref(null)

const totalDataStreamsChats = ref(null)

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

            // if (event.data.chats.length === totalDataStreamsChats.value) {
            // }
          }
        } else if (res?.length === 0 || !res) {
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
    const chatCurrently = chats.value?.slice()?.find(chat => chat?.chatId === data?.chatId)
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
    }
  })
})

onUnmounted(() => {
  if (apiChatsWorker.value) {
    apiChatsWorker.value.terminate()
    checkChatsWorker.value?.terminate()
  }
})

</script>

<template>
  <div class="flex flex-col gap-2">
    <Header>
      <template #search>
        <SearchMessenger />
      </template>
    </Header>
    <ListChat>
      <template #list>
        <ul>
          <li v-for="item in chats" :key="item.id">
            <ChatItem :item="item" />
          </li>
        </ul>
      </template>
    </ListChat>
  </div>
</template>
