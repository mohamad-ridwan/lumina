<script setup>
import VLazyImage from "v-lazy-image";
import { useChatRoomStore } from '@/stores/chat-room'
import { CircleProgressBar } from 'circle-progress.vue';
import { storeToRefs } from "pinia";
import { computed, markRaw, onBeforeMount, ref, toRefs, triggerRef, watch } from "vue";
import { general } from "@/helpers/general";

const { sortLatestGalleryMessages } = general

// chat-room store
const chatRoomStore = useChatRoomStore()
const { handleSetActiveMediaData } = chatRoomStore
const { activeMediaData, mediaGallery, chatRoomMessages } = storeToRefs(chatRoomStore)

const props = defineProps({
  imgClass: String,
  info: Object,
})

const { imgClass, info, itemMessage } = toRefs(props)

const currentImageUrl = ref(props.info?.url);

const messageComputed = computed(() => {
  const wrapperCalculatedStyle = () => {
    const originalWidth = info.value?.dimension?.width;
    const originalHeight = info.value?.dimension?.height;
    if (!originalWidth || !originalHeight) {
      // Memberikan rasio aspek default jika dimensi tidak tersedia
      // atau jika Anda ingin tampilan awal yang stabil sebelum dimensi dimuat.
      // Misalnya, rasio 16:9 atau 4:3
      return { 'width': '100%', 'max-width': '100%', "max-height": '400px' }; // Default fallback
    }
    // --- Konfigurasi Ukuran Maksimum untuk Wrapper Thumbnail ---
    // Ini adalah batas maksimal untuk *tampilan* wrapper Anda di UI.
    // Sesuaikan nilai-nilai ini sesuai desain UI Anda.
    const MAX_WRAPPER_WIDTH = 220; // Contoh lebar maks yang cocok untuk thumbnail
    const MAX_WRAPPER_HEIGHT = 300; // Sesuai dengan `max-h-[300px]` yang Anda miliki
    let calculatedWidth = originalWidth;
    let calculatedHeight = originalHeight
    // Skala dimensi agar muat dalam batas MAX_WRAPPER_WIDTH / MAX_WRAPPER_HEIGHT
    // Ini akan menjadi dimensi intrinsic untuk wrapper
    // Prioritaskan lebar jika gambar landscape
    if (originalWidth > originalHeight) { // Landscape
      if (calculatedWidth > MAX_WRAPPER_WIDTH) {
        calculatedHeight = Math.round((calculatedHeight * MAX_WRAPPER_WIDTH) / calculatedWidth);
        calculatedWidth = MAX_WRAPPER_WIDTH;
      }
      // Setelah lebar di-limit, cek tinggi
      if (calculatedHeight > MAX_WRAPPER_HEIGHT) {
        calculatedWidth = Math.round((calculatedWidth * MAX_WRAPPER_HEIGHT) / calculatedHeight);
        calculatedHeight = MAX_WRAPPER_HEIGHT;
      }
    } else { // Portrait atau persegi
      if (calculatedHeight > MAX_WRAPPER_HEIGHT) {
        calculatedWidth = Math.round((calculatedWidth * MAX_WRAPPER_HEIGHT) / calculatedHeight);
        calculatedHeight = MAX_WRAPPER_HEIGHT;
      }
      // Setelah tinggi di-limit, cek lebar
      if (calculatedWidth > MAX_WRAPPER_WIDTH) {
        calculatedHeight = Math.round((calculatedHeight * MAX_WRAPPER_WIDTH) / calculatedHeight);
        calculatedWidth = MAX_WRAPPER_WIDTH;
      }
    }
    // Pastikan dimensi tidak nol atau sangat kecil karena pembulatan
    calculatedWidth = Math.max(1, calculatedWidth);
    calculatedHeight = Math.max(1, calculatedHeight);

    return {
      // `aspect-ratio` akan membuat wrapper menyesuaikan tingginya berdasarkan lebarnya
      // dan rasio ini. Ini adalah kunci untuk wrapper yang proporsional.
      'aspect-ratio': `${originalWidth} / ${originalHeight}`,
      // 'aspect-ratio': `${calculatedWidth} / ${calculatedHeight}`,
      // Tambahkan `max-width` dan `max-height` ke style binding untuk kontrol yang lebih ketat
      // meskipun Anda sudah memiliki `max-w-full w-full max-h-[300px]` di kelas Tailwind.
      // Jika Anda ingin *width* dan *max-width* responsif penuh dari Tailwind,
      // Anda bisa menghapus properti 'width' dan 'max-width' di sini dan hanya
      // mengandalkan CSS kelas.
      'max-height': `${MAX_WRAPPER_HEIGHT}px`, // Tetapkan max-height eksplisit
      'max-width': `${originalWidth}px`, // Tetapkan max-width eksplisit
    };
  }
  const memoizedImageOnMediaGallery = () => {
    if (!mediaGallery.value) return null
    return mediaGallery.value.findIndex(item => item?.messageId === props.info?.messageId)
  }

  return {
    memoizedImageOnMediaGallery: memoizedImageOnMediaGallery(),
    wrapperCalculatedStyle: wrapperCalculatedStyle()
  }
})

const handleClickImg = () => {
  if (props.info.isProgressDone === false || props.info.isCancelled) return
  handleSetActiveMediaData({ ...props.info, key: activeMediaData?.value?.key ? activeMediaData?.value?.key + 1 : 1 })
}

const handleImageError = () => {
  if (info.value?.thumbnail) {
    currentImageUrl.value = info.value?.thumbnail
    if (messageComputed.value.memoizedImageOnMediaGallery !== -1) {
      mediaGallery.value[messageComputed.value.memoizedImageOnMediaGallery].document.url = info.value?.thumbnail
      mediaGallery.value = [...mediaGallery.value]
      triggerRef(mediaGallery)
    }
  }
}

// save image to media gallery
onBeforeMount(() => {
  if ((props.info.isProgressDone && !props.info.isCancelled) && messageComputed.value.memoizedImageOnMediaGallery === -1 || messageComputed.value.memoizedImageOnMediaGallery === null) {
    const item = chatRoomMessages.value.find(msg => msg?.messageId === props.info?.messageId)
    if (item) {
      mediaGallery.value.push(item)
      mediaGallery.value = markRaw(mediaGallery.value.sort((a, b) => sortLatestGalleryMessages(a, b, info.value?.profileId)))
      triggerRef(mediaGallery)
    }
  }
})

watch(() => [info.value?.isProgressDone, info.value?.isCancelled], ([isProgressDone, isCancelled]) => {
  if (isProgressDone && isCancelled === false && (messageComputed.value.memoizedImageOnMediaGallery === -1 || messageComputed.value.memoizedImageOnMediaGallery === null)) {
    const item = chatRoomMessages.value.find(msg => msg?.messageId === props.info?.messageId)
    if (item) {
      mediaGallery.value.push(item)
      mediaGallery.value = markRaw(mediaGallery.value.sort((a, b) => sortLatestGalleryMessages(a, b, info.value?.profileId)))
      triggerRef(mediaGallery)
    }
  }
})

watch(() => info.value?.url, (newUrl) => {
  if (newUrl) {
    currentImageUrl.value = newUrl
  }
});

</script>

<template>
  <div @contextmenu.prevent @click.prevent.stop="handleClickImg"
    class="cursor-pointer flex justify-center bg-gray-500/60 overflow-hidden relative w-full" :class="imgClass"
    :style="messageComputed.wrapperCalculatedStyle">
    <v-lazy-image :key="info?.messageId" :src="currentImageUrl" :src-placeholder="info?.thumbnail"
      class="rounded-sm rotate-180 image-media object-contain" :heigt="info?.dimension?.height"
      :width="info?.dimension?.width" draggable="false" :sizes="`(max-width: ${info?.dimension?.width}px) 220px, 400px`"
      @error="handleImageError" />

    <div v-if="!info.isProgressDone || info.isCancelled" class="absolute rotate-180 top-2 right-2">
      <div class="h-fit w-fit bg-black/30 rounded-full">
        <CircleProgressBar v-if="!info.isProgressDone" :value="info.progress" :max="100" rounded :size="25"
          colorFilled="#2e74e8" colorUnfilled="#2e74e8" colorBack="#00000000">
          <i class="pi pi-times !text-[9px]" style="color: white"></i>
        </CircleProgressBar>
        <div v-if="info.isCancelled" class="gap-1 flex items-center p-1 px-1.5">
          <span class="text-xs text-white">Cancelled</span>
          <i class="pi pi-upload !text-white !text-[9px]"></i>
        </div>
      </div>
    </div>
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
