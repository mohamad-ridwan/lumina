<script setup>
import { socket } from '@/services/socket/socket';
import { useChatRoomStore } from '@/stores/chat-room';
import { chatsStore } from '@/stores/chats';
import { storeToRefs } from 'pinia';
import { Button } from 'primevue';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import calendar from 'dayjs/plugin/calendar'

// config depedencies
dayjs.extend(relativeTime)
dayjs.extend(calendar)

// props
const { recipientId, profileId, } = defineProps(['recipientId', 'profileId', 'profileIdConnection'])

// store
// chat room store
const chatRoomStore = useChatRoomStore()
const { setChatRoom, resetChatRoomEventSource } = chatRoomStore
const { chatRoom, chatRoomEventSource } = storeToRefs(chatRoomStore)
// chats store
const chatStore = chatsStore()
const { chats } = storeToRefs(chatStore)

// state
// const username = shallowRef(null)
// const image = shallowRef(null)
// const userProfileSocketUpdate = ref(null)
const now = ref(Date.now())

// logic
let intervalId = undefined

const memoizedChatRoomId = computed(() => {
  return chatRoom.value?.chatRoomId
})
const memoizedChatId = computed(() => {
  return chatRoom.value?.chatId
})
const memoizedStatusUserOnline = computed(() => {
  return chats.value?.find(chat => chat?.userIds?.find(id => id === recipientId))?.lastSeenTime
})
const profileInfo = computed(() => {
  if (!memoizedChatId.value) {
    return {
      username: null,
      image: ''
    }
  }

  const currentChat = chats.value.find(chat => chat?.chatId === memoizedChatId.value)
  return {
    username: currentChat?.username,
    image: currentChat?.image
  }
})

const lastSeenText = computed(() => {
  const status = memoizedStatusUserOnline.value
  if (!status || status === 'online') return ''

  const lastSeenTime = dayjs(Number(status))
  const nowTime = dayjs(now.value)

  if (nowTime.diff(lastSeenTime, 'minute') < 1) {
    return 'just now'
  } else if (nowTime.diff(lastSeenTime, 'hour') < 24) {
    return lastSeenTime.fromNow()
  } else if (nowTime.diff(lastSeenTime, 'day') < 7) {
    return lastSeenTime.calendar()
  } else {
    return lastSeenTime.format('MMMM D, YYYY')
  }
})

function handleBack() {
  if (chatRoomEventSource.value) {
    resetChatRoomEventSource()
  }
  if (memoizedChatId.value) {
    socket.emit('leaveRoom', {
      chatRoomId: memoizedChatRoomId.value,
      chatId: memoizedChatId.value,
      userId: profileId
    })
  }
  setChatRoom({})
}

// hooks rendering
onMounted(() => {
  intervalId = setInterval(() => {
    now.value = Date.now()
  }, 60000) // update setiap menit
})
onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId)
  }
})

// onBeforeMount(() => {
//   socket.emit('user-profile', {
//     profileId: recipientId,
//     senderId: profileId,
//     profileIdConnection,
//     actionType: 'chat-room'
//   })
// })

// onMounted(() => {
//   socket.on('user-profile', (data) => {
//     if (
//       data?.actionType === 'chat-room' &&
//       data?.senderId === profileId &&
//       data?.profileIdConnection === profileIdConnection &&
//       data?.profile?.id === recipientId
//     ) {
//       userProfileSocketUpdate.value = data
//     }
//   })
// })

// watch(userProfileSocketUpdate, (data) => {
//   if (
//     data?.actionType === 'chat-room' &&
//     data?.senderId === profileId &&
//     data?.profileIdConnection === profileIdConnection &&
//     data?.profile?.id === recipientId
//   ) {
//     username.value = data.profile.username
//     image.value = data.profile.image
//   }
// })
</script>

<template>
  <header class="bg-white px-4 py-3 border-b-[#f1f1f1] border-b-[1px] flex items-center gap-4">
    <Button icon="pi pi-angle-left" aria-label="Back"
      class="!rounded-full !bg-transparent hover:!bg-transparent !h-[25px] !w-[25px] justify-center items-center flex cursor-pointer !text-black !outline-none !border-none !p-0"
      size="large" icon-class="!text-lg" @click="handleBack" />
    <div class="flex items-center gap-3">
      <div class="relative">
        <img :src="profileInfo.image" alt="profile" :class="`object-cover rounded-full h-10 w-10 sm:h-11 sm:w-11`">
        <div v-if="memoizedStatusUserOnline && memoizedStatusUserOnline === 'online'"
          class="absolute bottom-0.5 right-0">
          <div class="h-[11px] w-[11px] rounded-full bg-green-500 border-[1px] border-white"></div>
        </div>
      </div>
      <div class="flex flex-col">
        <h2 class="text-sm sm:text-lg font-semibold">{{ profileInfo.username }}</h2>
        <span v-if="memoizedStatusUserOnline && memoizedStatusUserOnline !== 'online'"
          class="text-[11px] text-[#6b7280]">
          Last seen {{ lastSeenText }}
        </span>
      </div>
    </div>
  </header>
</template>
