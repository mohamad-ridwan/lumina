<!-- components/ImageLightbox.vue -->
<script setup>
import { useChatRoomStore } from '@/stores/chat-room'
import VLazyImage from "v-lazy-image";
import { storeToRefs } from 'pinia'
import { computed, watch } from 'vue'
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
import 'lightgallery/css/lightgallery.css';
import 'lightgallery/css/lg-thumbnail.css';
import 'lightgallery/css/lg-zoom.css';

dayjs.extend(isToday);
dayjs.extend(isYesterday);
dayjs.extend(weekOfYear);
dayjs.extend(weekday);

const { formatDate } = general

const chatRoomStore = useChatRoomStore()
const { activeMediaData, lightboxEl, galleryInstance } = storeToRefs(chatRoomStore)

const media = computed(() => {
  if (!activeMediaData.value) return []
  // return [activeMediaData.value.url]
  return [activeMediaData.value]
})

const plugins = [lgThumbnail, lgZoom]

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
      const username = item?.username ? item?.latestMessageTimestamp ? `<p class="text-sm text-gray-500">by ${item.username}</p>` : `<p class="text-sm text-gray-500">${item.username}</p>` : ''
      return {
        src: item.url,
        thumb: item.thumbnail,
        subHtml: `
    ${item.caption ? `<h4 class="text-base">${item.caption}</h4>` : ''}
    ${username}
    ${item.latestMessageTimestamp ? `<p class="text-xs text-gray-400">${date(item.latestMessageTimestamp, item.hours)}</p>` : ''}
  `,
      }
    }),
    plugins,
    closable: true,
    closeOnTap: true,
    rotate: true,
    zoom: true,
    thumbnail: true,
    loop: false,
    download: true,
  })
  galleryInstance.value.openGallery(0)
}

watch(activeMediaData, (data) => {
  if (data) {
    openLightbox()
  }
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
