<script setup>
import ChatRoomLayout from '@/layout/chat-room/ChatRoomLayout.vue';
import ChatLayout from '@/layout/chat/ChatLayout.vue';
import { socket } from '@/services/socket/socket';
import { chatsStore } from '@/stores/chats';
import { usersStore } from '@/stores/users';
import { storeToRefs } from 'pinia';
import { computed, markRaw, onBeforeMount, onBeforeUnmount, onMounted, shallowRef, triggerRef, watch } from 'vue';

// store
const userStore = usersStore()
const { profile } = storeToRefs(userStore)
// chats store
const chatStore = chatsStore()
const { chats } = storeToRefs(chatStore)

// state
const userOnlineSocketUpdate = shallowRef({
  key: 0, // because need trigger different value
  id: null
})
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

onBeforeMount(() => {
  socket.on('userOnline', (id) => {
    userOnlineSocketUpdate.value.id = id
    userOnlineSocketUpdate.value.key = + 1
    triggerRef(userOnlineSocketUpdate)
  })
  socket.on('userOffline', (data) => {
    userOfflineSocketUpdate.value = data
  })
})

const notifyOnline = () => {
  if (socket?.connected && profileId.value) {
    socket.emit('userOnline', profileId.value)
  }
}

onMounted(() => {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      notifyOnline()
    }
  })

  window.addEventListener('focus', notifyOnline)
  window.addEventListener('online', notifyOnline)
})

onBeforeUnmount(() => {
  window.removeEventListener('focus', notifyOnline)
  window.removeEventListener('online', notifyOnline)
})

watch(userOfflineSocketUpdate, (data) => {
  if (data?.id) {
    const chatUserIndex = markRaw(memoizedChats.value)?.slice()?.findIndex(chat => chat?.userIds.find(recipientId => recipientId === data.id))
    if (chatUserIndex !== -1) {
      chats.value[chatUserIndex] = {
        ...chats.value[chatUserIndex],
        lastSeenTime: data.lastSeenTime
      }
      chats.value = markRaw([...chats.value]) // gunakan markRaw karena hanya replace array
      triggerRef(chats)
    }
  }
})

watch(userOnlineSocketUpdate, (data) => {
  if (data.id !== profileId.value) {
    const chatUserIndex = markRaw(memoizedChats.value)?.slice()?.findIndex(chat => chat?.userIds.find(recipientId => recipientId === data.id))
    if (chatUserIndex !== -1) {
      chats.value[chatUserIndex] = {
        ...chats.value[chatUserIndex],
        lastSeenTime: 'online'
      }
      chats.value = markRaw([...chats.value]) // gunakan markRaw karena hanya replace array
      triggerRef(chats)
    }
  }
})
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-3 min-h-dvh">
    <ChatLayout />
    <ChatRoomLayout />
  </div>
</template>
