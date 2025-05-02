<script setup>
import { socket } from '@/services/socket/socket'
import { useChatRoomStore } from '@/stores/chat-room'
import { usersStore } from '@/stores/users'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'

const { reactions, profileId, reactionCurrently, messageId } = defineProps(['reactions', 'profileId', 'reactionCurrently', 'messageId'])

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
  const map = new Map();
  reactions.forEach(react => {
    if (!map.has(react.emoji)) {
      map.set(react.emoji, react);
    }
  });
  return Array.from(map.values());
});

const images = computed(() => {
  return reactions.map((react, key) => {
    if (react.senderUserId === profileId) {
      return {
        image: profile.value?.data?.image,
        key
      }
    }
    return {
      image: chatRoom.value?.image,
      key
    }
  })
})

const submitReactionMessage = () => {
  if (!reactionCurrently) return

  const req = {
    chatRoomId: memoizedChatRoomId.value,
    chatId: memoizedChatId.value,
    messageId,
    reaction: {
      emoji: reactionCurrently.emoji,
      senderUserId: profileId,
      code: reactionCurrently.code,
      latestMessageTimestamp: `${Date.now()}`
    },
    eventType: "reaction-message"
  }

  socket.emit('sendMessage', req)
}
</script>

<template>
  <div class="flex pb-1.5">
    <button type="button" class="bg-white rounded-full pr-2 py-[2px] flex items-center gap-2 cursor-pointer"
      :class="reactions.length > 1 ? 'pl-0' : 'pl-1'" @click.prevent="submitReactionMessage">
      <div class="flex gap-1">
        <div v-for="react of emojis" class="text-[15px] rotate-180">{{ react.emoji }}</div>
      </div>
      <div class="flex items-center">
        <img v-for="image of images" class="rounded-full h-6 w-6 object-cover border border-white rotate-180"
          :class="image.key > 0 ? 'translate-x-[7px]' : ''" :src="image.image" />
      </div>
    </button>
  </div>
</template>
