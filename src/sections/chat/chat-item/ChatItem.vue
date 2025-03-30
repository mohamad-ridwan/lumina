<script setup>
// import
import ChatProfile from '@/components/ChatProfile.vue';
import { fetchChatRoom } from '@/services/api/chat-room';
import { socket } from '@/services/socket/socket';
import { useChatRoomStore } from '@/stores/chat-room';
import { usersStore } from '@/stores/users';
import { onBeforeMount, onMounted, ref } from 'vue';

// props
const { item } = defineProps(['item'])

// store
// profile store
const userStore = usersStore()
const { profile, profileIdConnection } = userStore
// chat-room store
const chatRoomStore = useChatRoomStore()
const { setChatRoom } = chatRoomStore

// state
const name = ref('')

// logic
const userIdCurrently = item.userIds.filter(id => id !== profile.data.id)?.[0]

const handleClickUser = async () => {
  // get chat room
  const chatRoomCurrently = await fetchChatRoom({
    userIds: item.userIds,
    mainUserId: profile.data.id
  })
  if (chatRoomCurrently?.data) {
    setChatRoom(chatRoomCurrently)
  }
}

// hooks rendering
onBeforeMount(() => {
  if (profile) {
    if (userIdCurrently) {
      socket.emit('user-profile', {
        profileId: userIdCurrently,
        senderId: profile.data.id,
        profileIdConnection,
        actionType: 'chats'
      })
    }
  }
})

onMounted(() => {
  socket.on('user-profile', (data) => {
    if (
      (data?.senderId === profile?.data?.id) &&
      (data?.profileIdConnection === profileIdConnection) &&
      (data.profile.id === userIdCurrently) &&
      (data?.actionType === 'chats')
    ) {
      name.value = data.profile.username
    }
  })
})

</script>

<template>
  <ChatProfile :username="name" :from-me="item.latestMessage.senderUserId === profile?.data?.id"
    :text-message="item.latestMessage.textMessage" @click="handleClickUser" />
</template>
