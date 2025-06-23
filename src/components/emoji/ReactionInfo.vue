<script setup>
import { socket } from '@/services/socket/socket'
import { useChatRoomStore } from '@/stores/chat-room'
import { usersStore } from '@/stores/users'
import { storeToRefs } from 'pinia'
import { computed, toRefs } from 'vue'
import ImageUserReactionInfo from './ImageUserReactionInfo.vue'

const props = defineProps(['reactions', 'profileId', 'reactionCurrently', 'messageId', 'wrapperClass'])

const { reactions, profileId, reactionCurrently, messageId, wrapperClass } = toRefs(props)

// store
// chat room store
const chatRoomStore = useChatRoomStore()
const { chatRoom } = storeToRefs(chatRoomStore)
// profile store
const userStore = usersStore()
const { profile } = storeToRefs(userStore)

const memoizedChatRoomId = computed(() => {
  return chatRoom.value?.chatRoomId
})
const memoizedChatId = computed(() => {
  return chatRoom.value?.chatId
})

const emojis = computed(() => {
  return [...new Map(reactions.value.map(r => [r.emoji, r])).values()]
})

const images = computed(() => {
  return reactions.value.map((react, key) => {
    if (react.senderUserId === profileId.value) {
      return {
        imgCropped: profile.value?.data?.imgCropped ?? '/avatar.png',
        thumbnail: profile.value?.data?.thumbnail,
        key
      }
    }
    return {
      imgCropped: chatRoom.value?.imgCropped,
      thumbnail: chatRoom.value?.thumbnail,
      key
    }
  })
})

const submitReactionMessage = () => {
  if (!reactionCurrently.value) return

  const req = {
    chatRoomId: memoizedChatRoomId.value,
    chatId: memoizedChatId.value,
    messageId: messageId.value,
    reaction: {
      emoji: reactionCurrently.value.emoji,
      senderUserId: profileId.value,
      code: reactionCurrently.value.code,
      latestMessageTimestamp: `${Date.now()}`
    },
    eventType: "reaction-message"
  }

  socket.emit('sendMessage', req)
}
</script>

<template>
  <div :class="`flex pb-1.5 ${wrapperClass}`">
    <button type="button" class="bg-white rounded-full pr-1.5 py-[1.5px] flex items-center gap-2 cursor-pointer"
      :class="reactions.length > 1 ? 'pl-0' : 'pl-1'" @click.prevent="submitReactionMessage">
      <div class="flex gap-1">
        <div v-for="react of emojis" class="text-[13px] rotate-180">{{ react.emoji }}</div>
      </div>
      <div class="flex items-center">
        <template v-for="image of images" :key="image.key">
          <ImageUserReactionInfo :image="image" />
        </template>
      </div>
    </button>
  </div>
</template>
