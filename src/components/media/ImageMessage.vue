<script setup>
import VLazyImage from "v-lazy-image";
import { useChatRoomStore } from '@/stores/chat-room'
import { storeToRefs } from "pinia";

// chat-room store
const chatRoomStore = useChatRoomStore()
const { handleSetActiveMediaData } = chatRoomStore
const { activeMediaData } = storeToRefs(chatRoomStore)

const { imgClass, info } = defineProps({
  imgClass: String,
  info: Object
})

const handleClickImg = () => {
  handleSetActiveMediaData({ ...info, key: activeMediaData?.value?.key ? activeMediaData?.value?.key + 1 : 1 })
}
</script>

<template>
  <div @click.stop="handleClickImg" class="cursor-pointer flex justify-center bg-gray-500/60 overflow-hidden"
    :class="imgClass">
    <v-lazy-image :src="`${info?.url}`" :src-placeholder="info?.thumbnail"
      class="max-w-full max-h-[400px] rounded-sm rotate-180" sizes="(max-width: 320px) 280px, 440px" />
  </div>
</template>

<style scoped>
.v-lazy-image {
  filter: blur(10px);
  transition: filter 0.3s;
}

.v-lazy-image-loaded {
  filter: blur(0);
}
</style>
