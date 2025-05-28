<!-- components/ImageLightbox.vue -->
<script setup>
import { useChatRoomStore } from '@/stores/chat-room'
import VLazyImage from "v-lazy-image";
import { storeToRefs } from 'pinia'
import { computed, nextTick, watch } from 'vue'
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

const { formatDate } = general

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
    return mediaGallery.value.map(item => {
      const username = item?.senderUserId === profileId.value ? 'You' : chatRoom.value?.username
      return {
        url: item.document.url,
        thumbnail: item.document.url,
        caption: item.document.caption,
        username: username,
        latestMessageTimestamp: Number(item.latestMessageTimestamp),
        hours: dayjs(Number(item.latestMessageTimestamp)).format('HH.mm'),
        messageId: item.messageId,
      }
    })
  }
  return [activeMediaData.value]
})

// const date = computed(() => {
//   if (!activeMediaData.value || !activeMediaData.value?.latestMessageTimestamp) return ''
//   const itemDate = dayjs(Number(activeMediaData.value?.latestMessageTimestamp)).startOf('day')
//   return `${formatDate(itemDate)} at ${activeMediaData.value.hours}`
// })

const date = (latestMessageTimestamp, hours) => {
  if (!latestMessageTimestamp) return ''
  const itemDate = dayjs(Number(latestMessageTimestamp)).startOf('day')
  return `${formatDate(itemDate)} at ${hours}`
}

const openLightbox = async () => {
  // if (galleryInstance.value) return
  galleryInstance.value = lightGallery(lightboxEl.value, {
    dynamic: true,
    dynamicEl: media.value.map(item => {
      const username = item?.username
        ? item?.latestMessageTimestamp
          ? `<p class="text-sm text-gray-500">by ${item.username}</p>`
          : `<p class="text-sm text-gray-500">${item.username}</p>`
        : ''

      return {
        src: item.url,
        thumb: item.thumbnail,
        subHtml: `
      <div class="bg-black/70 p-4 rounded-lg max-w-full">
        ${item.caption ? `<h4 class="text-base text-white">${item.caption}</h4>` : ''}
        ${username}
        ${item.latestMessageTimestamp
            ? `<p class="text-xs text-gray-400">${date(item.latestMessageTimestamp, item.hours)}</p>`
            : ''
          }
      </div>
    `,
      }
    }),
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
  galleryInstance.value.refresh(media.value.map(item => {
    const username = item?.username
      ? item?.latestMessageTimestamp
        ? `<p class="text-sm text-gray-500">by ${item.username}</p>`
        : `<p class="text-sm text-gray-500">${item.username}</p>`
      : ''

    return {
      src: item.url,
      thumb: item.thumbnail,
      subHtml: `
      <div class="bg-black/70 p-4 rounded-lg max-w-full">
        ${item.caption ? `<h4 class="text-base text-white">${item.caption}</h4>` : ''}
        ${username}
        ${item.latestMessageTimestamp
          ? `<p class="text-xs text-gray-400">${date(item.latestMessageTimestamp, item.hours)}</p>`
          : ''
        }
      </div>
    `,
    }
  }))
})
</script>

<template>
  <!-- <vue-easy-lightbox :visible="visible" :imgs="images" :index="0" @hide="onHide" /> -->

  <div ref="lightboxEl" class="hidden">
    <a v-for="(item, index) in media" :key="index" :href="item.url" :data-sub-html="item.caption">
      <v-lazy-image :src="`${item?.url}`" :src-placeholder="item?.thumbnail" class="max-w-full max-h-[400px]"
        sizes="(max-width: 320px) 280px, 440px" />
    </a>
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
