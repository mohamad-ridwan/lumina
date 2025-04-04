<script setup>
// import
import ChatProfile from '@/components/ChatProfile.vue';
import { socket } from '@/services/socket/socket';
import { useChatRoomStore } from '@/stores/chat-room';
import { usersStore } from '@/stores/users';
import { computed, onBeforeMount, onMounted, ref, watch, } from 'vue';
import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import { storeToRefs } from 'pinia';

dayjs.extend(localizedFormat)

// props
const { item } = defineProps(['item'])

// store
// profile store
const userStore = usersStore()
const { profile, profileIdConnection } = storeToRefs(userStore)
// chat-room store
const chatRoomStore = useChatRoomStore()
const { handleClickUser } = chatRoomStore
const { chatRoom } = storeToRefs(chatRoomStore)

// state
const name = ref('')
const userProfileSocketUpdate = ref(null)

// logic
const userIdsCurrently = item.userIds.slice().find(id => id !== profile.value.data.id)
const memoizedChatRoomId = computed(() => chatRoom.value.chatRoomId);

// hooks rendering
onMounted(() => {
  socket.on('user-profile', (data) => {
    userProfileSocketUpdate.value = data
  })
})

watch(userProfileSocketUpdate, (data) => {
  if (
    (data?.senderId === profile.value?.data?.id) &&
    (data?.profileIdConnection === profileIdConnection.value) &&
    (data.profile.id === userIdsCurrently) &&
    (data?.actionType === 'chats')
  ) {
    name.value = data.profile.username
  }
})

onBeforeMount(() => {
  if (profile && userIdsCurrently) {
    socket.emit('user-profile', {
      profileId: userIdsCurrently,
      senderId: profile.value.data.id,
      profileIdConnection: profileIdConnection.value,
      actionType: 'chats'
    })
  }
})
</script>

<template>
  <ChatProfile :username="name" :from-me="item.latestMessage.senderUserId === profile?.data?.id"
    :text-message="item.latestMessage.textMessage" @click="handleClickUser(profile?.data.id, item)"
    :latest-message-timestamp="dayjs(item.latestMessageTimestamp).format('HH.mm')"
    :unread-count="item.unreadCount[profile?.data.id]" :is-active="item.chatRoomId === memoizedChatRoomId" />
</template>
