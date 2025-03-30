<script setup>
// import
import ChatProfile from '@/components/ChatProfile.vue';
import { socket } from '@/services/socket/socket';
import { usersStore } from '@/stores/users';
import { onBeforeMount, onMounted, ref } from 'vue';

// props
const { item } = defineProps(['item'])

// store
// profile store
const userStore = usersStore()
const { profile } = userStore

// state
const name = ref('')

const userIdCurrently = item.userIds.filter(id => id !== profile.data.id)?.[0]

// hooks rendering
onBeforeMount(() => {
  if (profile) {
    if (userIdCurrently) {
      socket.emit('user-profile', {
        profileId: userIdCurrently,
        senderId: profile.data.id
      })
    }
  }
})

onMounted(() => {
  socket.on('user-profile', (data) => {
    if (
      (data?.senderId === profile?.data?.id) &&
      (data.profile.id === userIdCurrently)
    ) {
      name.value = data.profile.username
    }
  })
})

</script>

<template>
  <ChatProfile :username="name" :from-me="item.latestMessage.senderUserId === profile?.data?.id"
    :text-message="item.latestMessage.textMessage" />
</template>
