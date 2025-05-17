<script setup>
// import
import ChatProfile from '@/components/ChatProfile.vue';
import { socket } from '@/services/socket/socket';
import { useChatRoomStore } from '@/stores/chat-room';
import { usersStore } from '@/stores/users';
import { computed, markRaw, onBeforeMount, ref, shallowRef, triggerRef, watch, } from 'vue';
import { storeToRefs } from 'pinia';
import { chatsStore } from '@/stores/chats';
import ChatProfileSkeleton from './ChatProfileSkeleton.vue';

// props
const { item } = defineProps(['item'])

// store
// profile store
const userStore = usersStore()
const { profile, profileIdConnection } = storeToRefs(userStore)
// chat-room store
const chatRoomStore = useChatRoomStore()
const { handleClickUser } = chatRoomStore
const { chatRoom, usersTyping } = storeToRefs(chatRoomStore)
// chats store
const chatStore = chatsStore()
const { chats } = storeToRefs(chatStore)

// state
const userProfileSocketUpdate = ref(null)
const userOnlineInfoSocketUpdate = shallowRef(null)

// logic
const userIdsCurrently = item.userIds.slice().find(id => id !== profile.value.data.id)
const memoizedChatRoomId = computed(() => chatRoom.value.chatRoomId);
const memoizedChats = computed(() => chats.value)

const isUserTyping = computed(() => {
  return usersTyping.value.find(type => type?.senderId === userIdsCurrently && type?.recipientId === profile.value?.data.id)
})

// hooks rendering
onBeforeMount(() => {
  socket.on('user-profile', (data) => {
    userProfileSocketUpdate.value = data
  })
  socket.on('getUserOnlineInfo', (data) => {
    userOnlineInfoSocketUpdate.value = data
  })
})

watch(userProfileSocketUpdate, (data) => {
  if (
    (data?.senderId === profile.value?.data?.id) &&
    (data?.profileIdConnection === profileIdConnection.value) &&
    (data.profile.id === userIdsCurrently) &&
    (data?.actionType === 'chats')
  ) {
    const chatUserIndex = markRaw(memoizedChats.value)?.slice()?.findIndex(chat => chat?.chatId === item?.chatId)
    if (chatUserIndex !== -1) {
      chats.value[chatUserIndex] = {
        ...chats.value[chatUserIndex],
        username: data.profile.username,
        image: data.profile.image
      }
      chats.value = markRaw([...chats.value]) // gunakan markRaw karena hanya replace data
      triggerRef(chats)
    }
  }
}, { immediate: true })

watch(userOnlineInfoSocketUpdate, (data) => {
  if (
    (data?.senderId === profile.value?.data?.id) &&
    (data?.profileIdConnection === profileIdConnection.value) &&
    (data.recipientId === userIdsCurrently)
  ) {
    const chatUserIndex = markRaw(memoizedChats.value)?.slice()?.findIndex(chat => chat?.userIds.find(id => id === data.recipientId))
    if (chatUserIndex !== -1) {
      chats.value[chatUserIndex] = {
        ...chats.value[chatUserIndex],
        lastSeenTime: data.status
      }
      chats.value = markRaw([...chats.value]) // gunakan markRaw karena hanya replace data array
      triggerRef(chats)
    }
  }
}, { immediate: true })

onBeforeMount(() => {
  if (profile && userIdsCurrently) {
    socket.emit('user-profile', {
      profileId: userIdsCurrently,
      senderId: profile.value.data.id,
      profileIdConnection: profileIdConnection.value,
      actionType: 'chats'
    })
    socket.emit('getUserOnlineInfo', {
      recipientId: userIdsCurrently,
      senderId: profile.value?.data.id,
      profileIdConnection: profileIdConnection.value,
    })
  }
})
</script>

<template>
  <ChatProfileSkeleton v-if="!item?.image || !item?.username" />

  <ChatProfile v-if="item?.username && item?.image" :username="item?.username"
    :text-message="item.latestMessage.textMessage || item.latestMessage?.document?.caption"
    @click="handleClickUser(profile?.data.id, item)" :unread-count="item.unreadCount[profile?.data.id]"
    :is-active="item.chatRoomId === memoizedChatRoomId" :image="item?.image" :status="item.lastSeenTime"
    :is-typing="isUserTyping" :document="item?.latestMessage?.document" :latest-message="item.latestMessage"
    :profile-id="profile?.data.id" />
</template>
