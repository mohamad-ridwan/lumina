<script setup>
// import
import ChatProfile from '@/components/ChatProfile.vue';
import { socket } from '@/services/socket/socket';
import { useChatRoomStore } from '@/stores/chat-room';
import { usersStore } from '@/stores/users';
import { computed, markRaw, onBeforeMount, ref, shallowRef, toRefs, triggerRef, watch, } from 'vue';
import { storeToRefs } from 'pinia';
import { chatsStore } from '@/stores/chats';
import ChatProfileSkeleton from './ChatProfileSkeleton.vue';

// props
const props = defineProps(['item'])
const { item } = toRefs(props)

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
const { chats, searchMessengerData } = storeToRefs(chatStore)

// state
const userProfileSocketUpdate = ref(null)
const userOnlineInfoSocketUpdate = shallowRef(null)

// logic
const userIdsCurrently = props.item.userIds.slice().find(id => id !== profile.value.data.id)
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
    const chatUserIndex = markRaw(memoizedChats.value)?.slice()?.findIndex(chat => chat?.chatId === item.value?.chatId)
    if (chatUserIndex !== -1) {
      chats.value[chatUserIndex] = {
        ...chats.value[chatUserIndex],
        username: data.profile.username,
        image: data.profile.image,
        thumbnail: data.profile.thumbnail,
        imgCropped: data.profile.imgCropped,
      }
      chats.value = markRaw([...chats.value]) // gunakan markRaw karena hanya replace data
      triggerRef(chats)
    }

    const searchMessageUserIndex = markRaw(searchMessengerData.value)
      ?.slice()
      ?.findIndex((chat) => chat?.chatId === item.value?.chatId)
    if (searchMessageUserIndex !== -1) {
      searchMessengerData.value[searchMessageUserIndex] = {
        ...searchMessengerData.value[searchMessageUserIndex],
        username: data.profile.username,
        image: data.profile.image,
        thumbnail: data.profile.thumbnail,
        imgCropped: data.profile.imgCropped,
      }
      searchMessengerData.value = markRaw([...searchMessengerData.value]) // gunakan markRaw karena hanya replace data
      triggerRef(searchMessengerData)
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

    const searchMessageUserIndex = markRaw(searchMessengerData.value)?.slice()?.findIndex(chat => chat?.userIds.find(id => id === data.recipientId))
    if (searchMessageUserIndex !== -1) {
      searchMessengerData.value[searchMessageUserIndex] = {
        ...searchMessengerData.value[searchMessageUserIndex],
        lastSeenTime: data.status
      }
      searchMessengerData.value = markRaw([...searchMessengerData.value]) // gunakan markRaw karena hanya replace data array
      triggerRef(searchMessengerData)
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

watch(() => item.value?.username, () => {
  if (!item.value?.username) {
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
  <ChatProfileSkeleton v-if="!item?.username" />

  <ChatProfile v-if="item?.username" :username="item?.username" @click="handleClickUser(profile?.data.id, item)"
    :unread-count="item.unreadCount[profile?.data.id]" :is-active="item.chatRoomId === memoizedChatRoomId"
    :image="item?.image" :status="item.lastSeenTime" :is-typing="isUserTyping" :latest-message="item.latestMessage"
    :profile-id="profile?.data.id" :img-cropped="item?.imgCropped" :thumbnail="item?.thumbnail" />
</template>
