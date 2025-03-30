<script setup>
// import
import ChatItem from '@/sections/chat/chat-item/ChatItem.vue';
import Header from '@/sections/chat/Header.vue';
import ListChat from '@/sections/chat/ListChat.vue';
import SearchMessenger from '@/sections/chat/SearchMessenger.vue'
import { fetchChats } from '@/services/api/chats';
import { chatsStore } from '@/stores/chats';
import { usersStore } from '@/stores/users';
import { onBeforeMount, onUnmounted, ref } from 'vue';

// store
// profile store
const userStore = usersStore()
const { profile } = userStore
// chats store
const chatStore = chatsStore()
const { chats, setChats } = chatStore

// state
// worker state
const apiChatsWorker = ref(null)
const checkChatsWorker = ref(null)

const totalDataStreamsChats = ref(null)
const chatsData = ref([])

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
            chats: chats.slice(),
            streams: res
          })

          // listen to check chats currently
          checkChatsWorker.value.onmessage = (event) => {
            setChats(event.data.chats)
            chatsData.value = event.data.chats

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
        <li v-for="item in chatsData" :key="item.id">
          <ChatItem :item="item" />
        </li>
      </template>
    </ListChat>
  </div>
</template>
