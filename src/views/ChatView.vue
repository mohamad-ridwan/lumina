<script setup>
import ChatRoomLayout from '@/layout/chat-room/ChatRoomLayout.vue';
import ChatLayout from '@/layout/chat/ChatLayout.vue';
import { socket } from '@/services/socket/socket';
import { chatsStore } from '@/stores/chats';
import { usersStore } from '@/stores/users';
import { storeToRefs } from 'pinia';
import { computed, markRaw, onBeforeMount, onMounted, shallowRef, watch } from 'vue';

// store
const userStore = usersStore()
const { profile } = storeToRefs(userStore)
// chats store
const chatStore = chatsStore()
const { setChats } = chatStore
const { chats } = storeToRefs(chatStore)

// state
const userOnlineSocketUpdate = shallowRef(null)
const userOfflineSocketUpdate = shallowRef(null)

// logic
const profileId = computed(() => profile.value?.data.id)
const memoizedChats = computed(() => chats.value)

// hooks rendering
onBeforeMount(() => {
  if (profileId.value) {
    socket.emit('userOnline', profileId.value)
  }
})

onMounted(() => {
  socket.on('userOnline', (id) => {
    userOnlineSocketUpdate.value = id
  })
  socket.on('userOffline', (data) => {
    userOfflineSocketUpdate.value = data
  })
})

watch(userOnlineSocketUpdate, (id) => {
  if (id !== profileId.value) {
    const chatUserIndex = markRaw(memoizedChats.value)?.slice()?.findIndex(chat => chat?.userIds.find(recipientId => recipientId === id))
    if (chatUserIndex !== -1) {
      chats.value[chatUserIndex] = markRaw({
        ...markRaw(chats.value[chatUserIndex]),
        lastSeenTime: 'online'
      })
      chats.value = markRaw([...chats.value])
      setChats(chats.value)
    }
  }
})

watch(userOfflineSocketUpdate, (data) => {
  if (data?.id) {
    const chatUserIndex = markRaw(memoizedChats.value)?.slice()?.findIndex(chat => chat?.userIds.find(recipientId => recipientId === data.id))
    if (chatUserIndex !== -1) {
      chats.value[chatUserIndex] = markRaw({
        ...markRaw(chats.value[chatUserIndex]),
        lastSeenTime: data.lastSeenTime
      })
      chats.value = markRaw([...chats.value])
      setChats(chats.value)
    }
  }
})
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-3 min-h-screen">
    <ChatLayout />
    <ChatRoomLayout />
  </div>
</template>
