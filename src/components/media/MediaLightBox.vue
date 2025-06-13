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

const handleAfterSlide = () => {
  console.log('handleAfterSlide called.');
  console.log('Value of galleryInstance.value at start:', galleryInstance.value);

  if (!galleryInstance.value) {
    console.warn('handleAfterSlide: galleryInstance.value is null or undefined.');
    return;
  }

  const lgOuterElement = document.querySelector('.lg-outer');
  console.log('Value of lgOuterElement (found by document.querySelector):', lgOuterElement);

  if (!lgOuterElement || !(lgOuterElement instanceof HTMLElement)) {
    console.error('handleAfterSlide: lgOuterElement is NOT a valid HTMLElement. Current value:', lgOuterElement);
    return;
  }

  const lgContentEl = lgOuterElement.querySelector('.lg-content');
  if (!lgContentEl) {
    console.warn('handleAfterSlide: Could not find .lg-content element.');
    return;
  }
  console.log('LG Content Element found:', lgContentEl);

  const currentSlide = lgContentEl.querySelector('.lg-current');
  if (!currentSlide) {
    console.warn('handleAfterSlide: Could not find .lg-current slide within .lg-content.');
    return;
  }
  console.log('Current Slide element found:', currentSlide);

  const captionEl = lgOuterElement.querySelector('.lg-sub-html');
  const mediaContainerEl = currentSlide.querySelector('.lg-img-wrap') || currentSlide.querySelector('.lg-video-cont');

  if (captionEl && mediaContainerEl) {
    console.log('Responsive height calculation is executing...');

    const captionHeight = captionEl.offsetHeight;
    console.log('Current Caption Height:', captionHeight);

    const lgOuterHeight = lgOuterElement.offsetHeight;
    console.log('Total LG Outer Height:', lgOuterHeight);

    let toolbarHeight = 0;
    const lgToolbarEl = lgOuterElement.querySelector('.lg-toolbar');
    if (lgToolbarEl) {
      toolbarHeight = lgToolbarEl.offsetHeight;
    }
    console.log('LG Toolbar Height:', toolbarHeight);

    // --- KRITIS: Menemukan elemen UI TERBAWAH yang menjadi BATAS `lg-content` ---
    // Anda mengatakan `lg-components` adalah patokan bottom. Mari kita gunakan itu.
    const lgComponentsEl = lgOuterElement.querySelector('.lg-components');
    let bottomBoundaryElement = lgComponentsEl;

    // Jika ada thumbnail dan itu di bawah components, atau ada progress bar di bawah components,
    // Anda perlu menentukan yang mana yang paling bawah yang menjadi batas.
    // Berdasarkan screenshot, sepertinya lg-components adalah container utama untuk bottom UI.
    const lgProgressBarEl = lgOuterElement.querySelector('.lg-progress-bar');
    const lgThumbnailEl = lgOuterElement.querySelector('.lg-thumb-outer');

    // Jika lgProgressBarEl ada dan posisinya di bawah lgComponentsEl, gunakan itu sebagai batas.
    // Atau jika lgThumbnailEl ada dan posisinya di bawah lgComponentsEl/lgProgressBarEl, gunakan itu.
    // Ini membutuhkan Anda untuk memeriksa struktur DOM Anda.
    // Untuk saat ini, kita asumsikan lgComponentsEl adalah batas bawah utama.

    if (!bottomBoundaryElement) {
      console.warn('Could not find .lg-components. Falling back to lgOuterHeight for bottom calculation.');
      // Jika lg-components tidak ditemukan, kita harus mencari batas bawah yang lain atau menggunakan offset tetap
      // Ini adalah fallback, tidak ideal.
      const defaultBottomOffset = 0; // Jarak default dari bawah outer
      const newLgContentBottom = defaultBottomOffset; // Misalnya
      lgContentEl.style.setProperty('bottom', `${newLgContentBottom}px`, 'important');
      console.log('New LG Content bottom set to (fallback):', newLgContentBottom, 'px');

    } else {
      // Mendapatkan posisi Y (top) relatif terhadap viewport
      const bottomBoundaryRect = bottomBoundaryElement.getBoundingClientRect();
      // Offset Top dari bottomBoundaryElement relatif terhadap lgOuterElement
      // lgOuterElement juga memiliki getBoundingClientRect
      const lgOuterRect = lgOuterElement.getBoundingClientRect();

      // Jarak dari top lgOuterElement ke top bottomBoundaryElement
      const distanceToBottomBoundaryFromLgOuterTop = bottomBoundaryRect.top - lgOuterRect.top;

      // Tinggi elemen batas bawah
      const bottomBoundaryHeight = bottomBoundaryElement.offsetHeight;
      console.log('Bottom Boundary Element (LG Components) Height:', bottomBoundaryHeight);

      // Jarak dari top `lg-outer` ke `bottom` dari `bottomBoundaryElement`
      const bottomOfBottomBoundary = distanceToBottomBoundaryFromLgOuterTop + bottomBoundaryHeight;

      // --- KUNCI REVISI: Atur `bottom` dari `lg-content` ---
      // `lg-content` harus berakhir di atas `captionEl` dan `bottomBoundaryElement`.
      // Jadi, `bottom` yang kita set pada `lg-content` adalah `(Tinggi caption) + (tinggi elemen UI bawah) + (padding_antara_caption_dan_UI_bawah)`
      // Atau, kita bisa ambil jarak dari `lgOuterBottom` ke `top` dari `captionEl`
      // Ini lebih akurat jika `captionEl` adalah elemen terakhir di atas UI bawah.

      // Mari kita coba definisi `newLgContentBottom` sebagai jarak dari *bawah* `lgOuterElement`
      // hingga ke *bawah* `captionEl`, lalu tambahkan sedikit padding.
      const captionRect = captionEl.getBoundingClientRect();
      const lgOuterBottom = lgOuterRect.bottom; // Posisi bawah lgOuterElement

      // Jarak dari bottom lgOuter ke bottom caption
      const distFromLgOuterBottomToCaptionBottom = lgOuterBottom - captionRect.bottom;

      // Tambahkan padding tambahan jika ada ruang kosong visual antara caption dan UI bawah ini
      const additionalSpacingBelowCaption = 20; // SESUAIKAN JIKA PERLU!
      // Misalnya jika ada padding antara caption dan thumbnail / komponen

      // newLgContentBottom = jarak dari bottom lgOuter ke top caption (atau top media container jika caption di atas)
      // Kita ingin lg-content membentang dari top-nya hingga tepat di atas caption.
      // bottom_lg_content = (height of lgOuter) - (top of caption) + (margin/padding above caption)
      // Ini rumit karena posisi `lg-content` itu sendiri adalah `absolute`.

      // Coba lagi dengan konsep: `lg-content` harus berhenti tepat di atas `captionEl`.
      // `bottom` dari `lg-content` seharusnya adalah jarak dari `lgOuterBottom` ke `top` dari `captionEl`.
      const newLgContentBottom = lgOuterHeight - (captionEl.offsetTop + lgContentEl.offsetTop); // Jarak top caption dari top lg-outer
      // Ini juga tidak tepat karena lg-content dan caption punya offset masing-masing.

      // --- Pendekatan Paling Langsung: Jarak dari bottom `lg-outer` ke `top` dari `captionEl` ---
      // Ini asumsi caption adalah elemen UI terbawah sebelum tombol navigasi/thumbnail.
      const distanceToCaptionTopFromLgOuterBottom = lgOuterHeight - captionEl.getBoundingClientRect().top + lgOuterRect.top;
      // tambahkan sedikit padding di bawah caption jika ada
      const newLgContentBottomFinal = distanceToCaptionTopFromLgOuterBottom + 20; // 20px padding

      lgContentEl.style.setProperty('bottom', `${newLgContentBottomFinal}px`, 'important');
      console.log('New LG Content bottom set to:', newLgContentBottomFinal, 'px');


    }


    const actualLgContentHeight = lgContentEl.offsetHeight;
    console.log('Actual LG Content Height after bottom adjustment:', actualLgContentHeight);

    const paddingAroundMediaInContent = 20;
    const finalMediaHeight = Math.max(100, actualLgContentHeight - paddingAroundMediaInContent);
    console.log('Calculated Final Media Max Height (not applied yet):', finalMediaHeight);


    // --- Bagian ini DIKOMENTARI untuk fokus pada `lg-content.bottom` ---
    /*
    mediaContainerEl.style.setProperty('height', `${finalMediaHeight}px`, 'important');
    mediaContainerEl.style.setProperty('width', 'auto', 'important');
    mediaContainerEl.style.setProperty('margin', 'auto', 'important');
    mediaContainerEl.style.setProperty('display', 'flex', 'important');

    const actualMediaEl = mediaContainerEl.querySelector('img') || mediaContainerEl.querySelector('video') || mediaContainerEl.querySelector('iframe');
    if (actualMediaEl) {
      actualMediaEl.style.setProperty('height', '100%', 'important');
      actualMediaEl.style.setProperty('width', 'auto', 'important');
      actualMediaEl.style.setProperty('object-fit', 'contain', 'important');
      console.log('Styles applied to actual media element (img/video/iframe) with !important.');
    } else {
      console.warn('Actual media (img/video/iframe) element not found inside container. Styles not applied to inner media.');
    }
    */

    // --- DEBUGGING POSITIONING: Memaksa Flexbox pada currentSlide ---
    // currentSlide.style.setProperty('display', 'flex', 'important');
    // currentSlide.style.setProperty('flex-direction', 'column', 'important');
    // currentSlide.style.setProperty('align-items', 'center', 'important');
    // currentSlide.style.setProperty('justify-content', 'center', 'important');
    // console.log('Applied flex centering to currentSlide.');

  } else {
    console.warn('handleAfterSlide: Caption element (.lg-sub-html) or media container element (img/video) not found. Responsive calculation skipped.');
  }
};

const handleAfterClose = () => {
  galleryInstance.value?.destroy?.(true)
  galleryInstance.value = null
}

watch(lightboxEl, async () => {
  if (!lightboxEl.value && !galleryInstance.value) return
  lightboxEl.value?.removeEventListener('lgBeforeSlide', handleGetMediaOnSliderChange)
  lightboxEl.value?.addEventListener('lgBeforeSlide', (event) => handleGetMediaOnSliderChange(event, profileId.value))
  lightboxEl.value?.removeEventListener('lgAfterSlide', handleAfterSlide)
  lightboxEl.value?.addEventListener('lgAfterSlide', handleAfterSlide)
  lightboxEl.value?.removeEventListener('lgAfterClose', handleAfterClose)
  lightboxEl.value?.addEventListener('lgAfterClose', handleAfterClose)
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
        :data-poster="item?.poster ?? item.videoThumbnail">
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
