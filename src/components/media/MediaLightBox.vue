<!-- components/ImageLightbox.vue -->
<script setup>
import { useChatRoomStore } from '@/stores/chat-room'
import VLazyImage from "v-lazy-image";
import { storeToRefs } from 'pinia'
import { computed, nextTick, toRaw, triggerRef, watch } from 'vue'
// import VueEasyLightbox from 'vue-easy-lightbox'
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import isToday from 'dayjs/plugin/isToday';
import isYesterday from 'dayjs/plugin/isYesterday';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import weekday from 'dayjs/plugin/weekday';
import { general } from '@/helpers/general'
import lightGallery from 'lightgallery'
import lgThumbnail from 'lightgallery/plugins/thumbnail';
import lgZoom from 'lightgallery/plugins/zoom';
import lgVideo from 'lightgallery/plugins/video'
import lgAutoplay from 'lightgallery/plugins/autoplay'
import lgFullscreen from 'lightgallery/plugins/fullscreen'
import lgHash from 'lightgallery/plugins/hash'
import lgRotate from 'lightgallery/plugins/rotate'
// import lgPager from 'lightgallery/plugins/pager'
// Core LightGallery CSS
import 'lightgallery/css/lightgallery.css'

// Plugin CSS
import 'lightgallery/css/lg-thumbnail.css'
import 'lightgallery/css/lg-zoom.css'
import 'lightgallery/css/lg-video.css'
import 'lightgallery/css/lg-autoplay.css'
import 'lightgallery/css/lg-fullscreen.css'
import 'lightgallery/css/lg-rotate.css'
// import 'lightgallery/css/lg-hash.css'
// import 'lightgallery/css/lg-pager.css'
import { usersStore } from '@/stores/users';

dayjs.extend(isToday);
dayjs.extend(isYesterday);
dayjs.extend(weekOfYear);
dayjs.extend(weekday);

const { captionMediaGallery, mediaGalleryData } = general

// profile store
const userStore = usersStore()
const { profile } = storeToRefs(userStore)
const chatRoomStore = useChatRoomStore()
const { handleGetMediaOnSliderChange } = chatRoomStore
const { activeMediaData, lightboxEl, galleryInstance, mediaGallery, chatRoom } = storeToRefs(chatRoomStore)

const profileId = computed(() => {
  return profile.value?.data?.id
})
// const recipientId = computed(() => {
//   return chatRoom.value?.userIds?.find(id => id !== profileId.value)
// })

const media = computed(() => {
  if (!activeMediaData.value) return []
  // return [activeMediaData.value.url]
  if (activeMediaData.value?.messageId && mediaGallery.value.length > 0) {
    return mediaGalleryData(mediaGallery.value, profileId.value, chatRoom.value?.username)
  }
  return [{ ...activeMediaData.value, type: 'image' }]
})

// const date = computed(() => {
//   if (!activeMediaData.value || !activeMediaData.value?.latestMessageTimestamp) return ''
//   const itemDate = dayjs(Number(activeMediaData.value?.latestMessageTimestamp)).startOf('day')
//   return `${formatDate(itemDate)} at ${activeMediaData.value.hours}`
// })

const openLightbox = async () => {
  // if (galleryInstance.value) return
  galleryInstance.value = lightGallery(lightboxEl.value, {
    dynamic: true,
    dynamicEl: captionMediaGallery(toRaw(media.value)),
    plugins: [lgThumbnail, lgZoom, lgVideo, lgAutoplay, lgFullscreen, lgHash, lgRotate],
    closable: true,
    closeOnTap: true,
    rotate: true,
    zoom: true,
    thumbnail: true,
    loop: false,
    download: true,
  })
  let imageIndex = 0
  if (activeMediaData.value?.messageId) {
    const index = mediaGallery.value.findIndex(item => item.messageId === activeMediaData.value.messageId)
    imageIndex = index !== -1 ? index : 0
  }
  galleryInstance.value.openGallery(imageIndex)
}

const handleImageError = (item) => {
  const mediaIndex = mediaGallery.value.findIndex(msg => msg?.messageId === item?.messageId)
  if (mediaIndex !== -1 && item?.videoThumbnail) {
    mediaGallery.value[mediaIndex].document.url = item.videoThumbnail
    mediaGallery.value[mediaIndex].document.thumbnail = item.videoThumbnail
    mediaGallery.value = [...mediaGallery.value]
    triggerRef(mediaGallery)
  }
}

watch(activeMediaData, (data) => {
  if (data) {
    openLightbox()
  }
})

watch(lightboxEl, async () => {
  if (!lightboxEl.value && !galleryInstance.value) return
  lightboxEl.value?.removeEventListener('lgBeforeSlide', handleGetMediaOnSliderChange)
  lightboxEl.value?.addEventListener('lgBeforeSlide', (event) => handleGetMediaOnSliderChange(event, profileId.value))
})

watch(media, async () => {
  if (!galleryInstance.value) return
  await nextTick()
  galleryInstance.value.refresh(captionMediaGallery(toRaw(media.value)))
})
</script>

<template>
  <!-- <vue-easy-lightbox :visible="visible" :imgs="images" :index="0" @hide="onHide" /> -->

  <div ref="lightboxEl" class="hidden">
    <template v-for="(item, index) in media" :key="index">
      <a v-if="item.type === 'image'" :href="item.url" :data-sub-html="item.caption" :data-src="item.url">
        <v-lazy-image :src="item.url" :src-placeholder="item.thumbnail" class="max-w-full max-h-[400px]"
          sizes="(max-width: 320px) 280px, 440px" @error="() => handleImageError(item)" />
      </a>
      <a v-else-if="item.type === 'video'" :href="item.url" :data-sub-html="item.caption" data-lg-size="1280-720"
        :data-video="JSON.stringify({ source: [{ src: item.url, type: 'video/mp4' }], poster: item.videoThumbnail })"
        :data-poster="item.videoThumbnail">
        <v-lazy-image :src="item.videoThumbnail" :src-placeholder="item.videoThumbnail" class="max-w-full max-h-[400px]"
          sizes="(max-width: 320px) 280px, 440px" />
      </a>
    </template>
  </div>

  <!-- <div v-if="visible"
    class="fixed top-0 left-0 w-full flex items-center justify-between bg-black/60 text-white text-lg py-2 px-4 z-[10000]">
    <div class="flex flex-col">
      <span class="font-semibold">{{ activeMediaData.username }}</span>
      <span v-if="date" class="text-sm text-gray-300">{{ date }}</span>
    </div>

    <Button icon="pi pi-times" severity="secondary" text rounded
      class="p-2 !text-white hover:bg-white/20 border-none hover:!text-gray-500" @click="onHide" />
  </div> -->
</template>

<style scoped>
/* .vel-btns-wrapper .btn__close {
  display: none;
} */

.v-lazy-image {
  filter: blur(10px);
  transition: filter 0.3s;
}

.v-lazy-image-loaded {
  filter: blur(0);
}
</style>
