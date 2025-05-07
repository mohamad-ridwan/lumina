<script setup>

import { useChatRoomStore } from '@/stores/chat-room'

// chat-room store
const chatRoomStore = useChatRoomStore()
const { handleSetActiveMediaData } = chatRoomStore

const { imgClass, info } = defineProps({
  imgClass: String,
  info: Object
})

const handleClickImg = () => {
  handleSetActiveMediaData(info)
}
</script>

<template>
  <div @click.stop="handleClickImg" class="cursor-pointer">
    <img :src="info?.url" loading="lazy" class="max-w-full max-h-64 object-cover rounded-sm rotate-180 bg-gray-500/70"
      :class="imgClass" />
  </div>
</template>
