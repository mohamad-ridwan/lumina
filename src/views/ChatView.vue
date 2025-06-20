<script setup>
import { general } from '@/helpers/general';
import ChatRoomLayout from '@/layout/chat-room/ChatRoomLayout.vue';
import ChatLayout from '@/layout/chat/ChatLayout.vue';
import ProfileLayoutWrapper from '@/layout/profile/ProfileLayoutWrapper.vue';
import { socket } from '@/services/socket/socket';
import { useChatRoomStore } from '@/stores/chat-room';
import { chatsStore } from '@/stores/chats';
import { usersStore } from '@/stores/users';
import { storeToRefs } from 'pinia';
import { computed, markRaw, onBeforeMount, onBeforeUnmount, onMounted, onUnmounted, shallowRef, triggerRef, watch } from 'vue';

const { deviceDetector } = general

// store
const userStore = usersStore()
const { profile } = storeToRefs(userStore)
// chats store
const chatStore = chatsStore()
const { chats, searchMessengerData } = storeToRefs(chatStore)
// chat-room store
const chatRoomStore = useChatRoomStore()
const { handleUpdateUsersTyping } = chatRoomStore
const { usersTyping, typeDevice } = storeToRefs(chatRoomStore)

// state
const userOnlineSocketUpdate = shallowRef({
  key: 0, // because need trigger different value
  id: null
})
const userOfflineSocketUpdate = shallowRef(null)
const typingStartSocketUpdate = shallowRef({
  key: 0,
  senderId: null,
  recipientId: null,
})
const typingStopSocketUpdate = shallowRef({
  key: 0,
  senderId: null,
  recipientId: null,
})

// logic
const profileId = computed(() => profile.value?.data.id)
const memoizedChats = computed(() => chats.value)

const handleDeviceDetector = () => {
  typeDevice.value = deviceDetector()
}

// hooks rendering
onMounted(() => {
  handleDeviceDetector()
  window.addEventListener('resize', handleDeviceDetector)

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

watch(typingStartSocketUpdate, (data) => {
  if (data?.recipientId === profile.value?.data.id) {
    handleUpdateUsersTyping(data, 'start')
  }
})

watch(typingStopSocketUpdate, (data) => {
  if (data?.recipientId === profile.value?.data.id) {
    handleUpdateUsersTyping(data, 'stop')
  }
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

    const searchMessageUserIndex = markRaw(searchMessengerData.value)?.slice()?.findIndex(chat => chat?.userIds.find(recipientId => recipientId === data.id))
    if (searchMessageUserIndex !== -1) {
      searchMessengerData.value[searchMessageUserIndex] = {
        ...searchMessengerData.value[searchMessageUserIndex],
        lastSeenTime: data.lastSeenTime
      }
      searchMessengerData.value = markRaw([...searchMessengerData.value]) // gunakan markRaw karena hanya replace array
      triggerRef(searchMessengerData)
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

    const searchMessageUserIndex = markRaw(searchMessengerData.value)?.slice()?.findIndex(chat => chat?.userIds.find(recipientId => recipientId === data.id))
    if (searchMessageUserIndex !== -1) {
      searchMessengerData.value[searchMessageUserIndex] = {
        ...searchMessengerData.value[searchMessageUserIndex],
        lastSeenTime: 'online'
      }
      searchMessengerData.value = markRaw([...searchMessengerData.value]) // gunakan markRaw karena hanya replace array
      triggerRef(searchMessengerData)
    }
  }
})

onUnmounted(() => {
  usersTyping.value = []
  window.removeEventListener('resize', handleDeviceDetector)
})
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-3">
    <ProfileLayoutWrapper />
    <ChatLayout />
    <ChatRoomLayout />
  </div>
</template>
