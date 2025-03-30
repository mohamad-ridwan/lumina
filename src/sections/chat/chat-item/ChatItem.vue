<script setup>
// import
import { socket } from '@/services/socket/socket';
import { usersStore } from '@/stores/users';
import { Button } from 'primevue';
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
  <Button v-slot="slotProps" asChild type="button" severity="secondary" aria-label="chat">
    <div v-bind="slotProps"
      class="!w-full !h-[4rem] rounded-lg bg-[#f1f1f1] !flex gap-3 !items-center px-3 !justify-start !border-none">
      <img
        src="https://images.unsplash.com/photo-1611095564985-89765398121e?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        alt="" class="object-cover h-[50px] w-[50px] rounded-full">

      <div class="flex flex-col">
        <h1 class="font-bold text-[0.9rem] text-[#111827]">{{ name }}</h1>
        <p class="gap-1 flex whitespace-nowrap max-w-[200px] text-[0.8rem] text-[#6b7280]">
          <span v-if="item.latestMessage.senderUserId === profile?.data?.id">You:</span>
          <span>{{ item.latestMessage.textMessage }}</span>
        </p>
      </div>
    </div>
  </Button>
</template>
