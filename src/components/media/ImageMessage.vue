<script setup>
import VLazyImage from "v-lazy-image";
import { useChatRoomStore } from '@/stores/chat-room'
import { storeToRefs } from "pinia";
import { computed, markRaw, onBeforeMount, onMounted, triggerRef } from "vue";

// chat-room store
const chatRoomStore = useChatRoomStore()
const { handleSetActiveMediaData } = chatRoomStore
const { activeMediaData, mediaGallery, chatRoomMessages } = storeToRefs(chatRoomStore)

const { imgClass, info, itemMessage } = defineProps({
  imgClass: String,
  info: Object,
})

const memoizedImageOnMediaGallery = computed(() => {
  if (!mediaGallery.value) return null
  return mediaGallery.value.findIndex(item => item?.messageId === info?.messageId)
})

const handleClickImg = () => {
  handleSetActiveMediaData({ ...info, key: activeMediaData?.value?.key ? activeMediaData?.value?.key + 1 : 1 })
}

// save image to media gallery
onBeforeMount(() => {
  if (memoizedImageOnMediaGallery.value === -1 || memoizedImageOnMediaGallery.value === null) {
    const item = chatRoomMessages.value.find(msg => msg?.messageId === info?.messageId)
    if (item) {
      mediaGallery.value.push(item)
      mediaGallery.value = markRaw(mediaGallery.value.sort((a, b) => {
        return Number(b.latestMessageTimestamp) - Number(a.latestMessageTimestamp)
      }))
      triggerRef(mediaGallery)
    }
  }
})

</script>

<template>
  <div @contextmenu.prevent @click.prevent.stop="handleClickImg"
    class="cursor-pointer flex justify-center bg-gray-500/60 overflow-hidden" :class="imgClass">
    <v-lazy-image :key="info?.messageId" :src="`${info?.url}`" :src-placeholder="info?.thumbnail"
      class="max-w-full max-h-[400px] rounded-sm rotate-180 image-media" draggable="false"
      sizes="(max-width: 320px) 280px, 440px" />
  </div>
</template>

<style scoped>
.v-lazy-image {
  filter: blur(10px);
  transition: filter 0.6s;
}

.v-lazy-image-loaded {
  filter: blur(0);
}

.image-media {
  -webkit-user-select: none;
  /* Safari / iOS */
  user-select: none;
  -webkit-touch-callout: none;
  /* Disable long-press menu on iOS */
}
</style>
