<script setup>
import VLazyImage from "v-lazy-image";
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
    <v-lazy-image :src="info?.url" class="max-w-full max-h-64 object-cover rounded-sm rotate-180 bg-gray-500/70"
      :class="imgClass" />
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
