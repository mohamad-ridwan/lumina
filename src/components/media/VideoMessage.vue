<script setup>
import { ref, watch, computed, onBeforeMount, triggerRef, markRaw, toRefs } from 'vue';
import { CircleProgressBar } from 'circle-progress.vue';
import { useChatRoomStore } from '@/stores/chat-room';
import { storeToRefs } from 'pinia';
import VLazyImage from "v-lazy-image";

// chat-room store
const chatRoomStore = useChatRoomStore()
const { handleSetActiveMediaData } = chatRoomStore
const { activeMediaData, mediaGallery, chatRoomMessages } = storeToRefs(chatRoomStore)

const props = defineProps({
  videoClass: String,
  info: Object,
})

const { videoClass, info, itemMessage } = toRefs(props)

// const videoPlayer = ref(null)

const currentPoster = ref(props.info?.poster);

const memoizedVideoMediaGallery = computed(() => {
  if (!mediaGallery.value) return null
  return mediaGallery.value.findIndex(item => item?.messageId === props.info?.messageId)
})

const handleClickVideo = () => {
  if (props.info.isProgressDone === false || props.info.isCancelled) return
  handleSetActiveMediaData({ ...props.info, key: activeMediaData?.value?.key ? activeMediaData?.value?.key + 1 : 1 })
}

// save video to media gallery
onBeforeMount(() => {
  if ((props.info.isProgressDone && !props.info.isCancelled) && (memoizedVideoMediaGallery.value === -1 || memoizedVideoMediaGallery.value === null)) {
    const item = chatRoomMessages.value.find(msg => msg?.messageId === props.info?.messageId)
    if (item) {
      mediaGallery.value.push(item)
      mediaGallery.value = markRaw(mediaGallery.value.sort((a, b) => {
        return Number(b.latestMessageTimestamp) - Number(a.latestMessageTimestamp)
      }))
      triggerRef(mediaGallery)
    }
  }
})

watch(() => [info.value?.isProgressDone, info.value?.isCancelled], ([isProgressDone, isCancelled]) => {
  if (isProgressDone && isCancelled === false && (memoizedVideoMediaGallery.value === -1 || memoizedVideoMediaGallery.value === null)) {
    const item = chatRoomMessages.value.find(msg => msg?.messageId === props.info?.messageId)
    if (item) {
      mediaGallery.value.push(item)
      mediaGallery.value = markRaw(mediaGallery.value.sort((a, b) => {
        return Number(b.latestMessageTimestamp) - Number(a.latestMessageTimestamp)
      }))
      triggerRef(mediaGallery)
    }
  }
})

const handleImageError = () => {
  if (info.value?.thumbnail) {
    currentPoster.value = info.value?.thumbnail
    if (messageComputed.value.memoizedImageOnMediaGallery !== -1) {
      mediaGallery.value[messageComputed.value.memoizedImageOnMediaGallery].document.poster = info.value?.thumbnail
      mediaGallery.value = [...mediaGallery.value]
      triggerRef(mediaGallery)
    }
  }
}

watch(() => info.value?.poster, (newPoster) => {
  currentPoster.value = newPoster
});
</script>

<template>
  <div @contextmenu.prevent @click.prevent.stop="handleClickVideo"
    class="cursor-pointer flex justify-center items-center bg-gray-500/60 overflow-hidden relative" :class="videoClass">
    <!-- <video v-if="info?.thumbnail" ref="videoPlayer" :src="info?.url" :poster="info?.thumbnail"
      class="w-full h-auto rotate-180" playsinline></video> -->
    <v-lazy-image :key="info?.messageId" :src="currentPoster" :src-placeholder="info?.thumbnail"
      class="rounded-sm rotate-180 image-media" draggable="false" :sizes="`(max-width: 320px) 220px, 400px`"
      @error="handleImageError" />

    <div class="absolute h-13 w-13 rounded-full flex justify-center items-center bg-black/60 rotate-180">
      <i class="pi pi-play-circle !text-2xl text-white"></i>
    </div>

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

    <!-- <div class="controls mt-2 flex items-center gap-4">
      <button @click="togglePlayPause" class="px-4 py-2 bg-blue-500 text-white rounded">
        {{ isPlaying ? 'Pause' : 'Play' }}
      </button>

      <input type="range" min="0" :max="duration" :value="currentTime" @input="seekVideo" class="flex-grow" />
      <span>{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</span>

      <input type="range" min="0" max="1" step="0.01" :value="volume" @input="setVolume" class="w-24" />
      <button @click="toggleMute" class="px-2 py-1 bg-gray-300 rounded">
        {{ isMuted ? 'Unmute' : 'Mute' }}
      </button>

      <button @click="toggleFullscreen" class="px-2 py-1 bg-gray-300 rounded">
        Fullscreen
      </button>

      <button @click="loadNewVideo" class="px-4 py-2 bg-green-500 text-white rounded">
        Load New Video
      </button>
    </div> -->
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

/* Gaya dasar untuk progress bar */
input[type="range"] {
  -webkit-appearance: none;
  /* Override default look */
  appearance: none;
  height: 8px;
  background: #d3d3d3;
  outline: none;
  opacity: 0.7;
  -webkit-transition: .2s;
  transition: opacity .2s;
  border-radius: 4px;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: #4A90E2;
  cursor: pointer;
  border-radius: 50%;
}

input[type="range"]::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: #4A90E2;
  cursor: pointer;
  border-radius: 50%;
}
</style>
