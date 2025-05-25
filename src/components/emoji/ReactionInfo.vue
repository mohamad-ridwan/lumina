<script setup>
import { socket } from '@/services/socket/socket'
import { useChatRoomStore } from '@/stores/chat-room'
import { usersStore } from '@/stores/users'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import VLazyImage from "v-lazy-image";

const { reactions, profileId, reactionCurrently, messageId, wrapperClass } = defineProps(['reactions', 'profileId', 'reactionCurrently', 'messageId', 'wrapperClass'])

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
        imgCropped: profile.value?.data?.imgCropped,
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
  <div :class="`flex pb-1.5 ${wrapperClass}`">
    <button type="button" class="bg-white rounded-full pr-1.5 py-[1.5px] flex items-center gap-2 cursor-pointer"
      :class="reactions.length > 1 ? 'pl-0' : 'pl-1'" @click.prevent="submitReactionMessage">
      <div class="flex gap-1">
        <div v-for="react of emojis" class="text-[13px] rotate-180">{{ react.emoji }}</div>
      </div>
      <div class="flex items-center">
        <v-lazy-image v-for="image of images" :src="`${image?.imgCropped}`" :src-placeholder="image?.thumbnail"
          class="rounded-full h-4.5 w-4.5 object-cover border border-white rotate-180"
          sizes="(max-width: 20px) 15px, 22px" />
      </div>
    </button>
  </div>
</template>

<style scoped>
.v-lazy-image {
  filter: blur(10px);
  transition: filter 0.7s;
}

.v-lazy-image-loaded {
  filter: blur(0);
}
</style>
