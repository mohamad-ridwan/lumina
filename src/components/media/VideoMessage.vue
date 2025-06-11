<script setup>
import { ref, onMounted, onUnmounted, watch, computed, onBeforeMount, triggerRef, markRaw } from 'vue';
import { CircleProgressBar } from 'circle-progress.vue';
import { useChatRoomStore } from '@/stores/chat-room';
import { storeToRefs } from 'pinia';

// chat-room store
const chatRoomStore = useChatRoomStore()
const { handleSetActiveMediaData } = chatRoomStore
const { activeMediaData, mediaGallery, chatRoomMessages } = storeToRefs(chatRoomStore)

const { videoClass, info, itemMessage } = defineProps({
  videoClass: String,
  info: Object,
})

const videoPlayer = ref(null); // Ref untuk mengakses elemen <video>
const videoSource = ref('https://adrienhobbs.github.io/vue-lazyload-video/video/Baga-Beach.mp4'); // URL video awal
const videoPoster = ref('https://www.w3schools.com/html/pic_mountain.jpg'); // Poster video

const isPlaying = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const volume = ref(1); // 0.0 - 1.0
const isMuted = ref(false);

const memoizedVideoMediaGallery = computed(() => {
  if (!mediaGallery.value) return null
  return mediaGallery.value.findIndex(item => item?.messageId === info?.messageId)
})

const handleClickVideo = () => {
  if (info.isProgressDone === false || info.isCancelled) return
  handleSetActiveMediaData({ ...info, key: activeMediaData?.value?.key ? activeMediaData?.value?.key + 1 : 1 })
}

// save video to media gallery
onBeforeMount(() => {
  if ((info.isProgressDone && !info.isCancelled) && (memoizedVideoMediaGallery.value === -1 || memoizedVideoMediaGallery.value === null)) {
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

// Method untuk toggle play/pause
const togglePlayPause = () => {
  if (!videoPlayer.value) return;
  if (isPlaying.value) {
    videoPlayer.value.pause();
  } else {
    videoPlayer.value.play();
  }
};

// Method untuk seek video
const seekVideo = (event) => {
  if (!videoPlayer.value) return;
  const newTime = parseFloat(event.target.value);
  videoPlayer.value.currentTime = newTime;
  currentTime.value = newTime; // Update reactive state immediately
};

// Method untuk set volume
const setVolume = (event) => {
  if (!videoPlayer.value) return;
  const newVolume = parseFloat(event.target.value);
  videoPlayer.value.volume = newVolume;
  volume.value = newVolume;
  isMuted.value = newVolume === 0; // Otomatis mute jika volume 0
};

// Method untuk toggle mute
const toggleMute = () => {
  if (!videoPlayer.value) return;
  videoPlayer.value.muted = !videoPlayer.value.muted;
  isMuted.value = videoPlayer.value.muted;
};

// Method untuk toggle fullscreen
const toggleFullscreen = () => {
  if (!videoPlayer.value) return;
  if (videoPlayer.value.requestFullscreen) {
    videoPlayer.value.requestFullscreen();
  } else if (videoPlayer.value.mozRequestFullScreen) { /* Firefox */
    videoPlayer.value.mozRequestFullScreen();
  } else if (videoPlayer.value.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
    videoPlayer.value.webkitRequestFullscreen();
  } else if (videoPlayer.value.msRequestFullscreen) { /* IE/Edge */
    videoPlayer.value.msRequestFullscreen();
  }
};

// Method untuk memuat video baru secara manual
const loadNewVideo = () => {
  const newVideoUrl = prompt('Masukkan URL video baru:');
  if (newVideoUrl) {
    videoSource.value = newVideoUrl;
    // Penting: Memuat ulang video setelah mengubah src
    // browser akan secara otomatis memuat ulang setelah src berubah
    // Anda bisa panggil videoPlayer.value.load() secara eksplisit juga jika perlu
    // videoPlayer.value.load();
    // isPlaying.value = false; // Setel ke pause setelah load baru
    // currentTime.value = 0; // Reset waktu
  }
};

// Event listener untuk video
const handleLoadedMetadata = () => {
  if (videoPlayer.value) {
    duration.value = videoPlayer.value.duration;
    volume.value = videoPlayer.value.volume; // Set initial volume
    isMuted.value = videoPlayer.value.muted; // Set initial mute status
  }
};

const handleTimeUpdate = () => {
  if (videoPlayer.value) {
    currentTime.value = videoPlayer.value.currentTime;
  }
};

const handleVideoEnded = () => {
  isPlaying.value = false;
  currentTime.value = 0;
};

// Fungsi format waktu (misal: 00:00)
const formatTime = (time) => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

// Lifecycle hooks
onMounted(() => {
  // Pastikan ref sudah terpasang
  if (videoPlayer.value) {
    // Anda bisa mengakses semua properti dan method dari elemen <video> di sini
    // console.log('Video element mounted:', videoPlayer.value);

    // Contoh: Mulai putar otomatis jika diinginkan (dengan mute untuk kebijakan browser)
    // videoPlayer.value.muted = true;
    // videoPlayer.value.play().catch(e => console.log('Autoplay failed:', e));
  }
});

onUnmounted(() => {
  // Bersihkan resource jika komponen dilepas
  if (videoPlayer.value) {
    videoPlayer.value.pause();
    videoPlayer.value.src = ''; // Hapus sumber video
    videoPlayer.value.load(); // Paksa browser untuk melepas resource
  }
});

// Watcher jika Anda ingin merespon perubahan videoSource secara eksternal
watch(videoSource, (newVal) => {
  if (newVal && videoPlayer.value) {
    videoPlayer.value.load(); // Memuat ulang video jika src berubah
    isPlaying.value = false; // Otomatis pause saat ganti video
    currentTime.value = 0; // Reset waktu
  }
});
</script>

<template>
  <div @contextmenu.prevent @click.prevent.stop="handleClickVideo"
    class="cursor-pointer flex justify-center items-center bg-gray-500/60 overflow-hidden relative" :class="videoClass">
    <video v-if="info?.thumbnail" ref="videoPlayer" :src="info?.url" :poster="info?.thumbnail"
      @loadedmetadata="handleLoadedMetadata" @timeupdate="handleTimeUpdate" @ended="handleVideoEnded"
      @play="isPlaying = false" @pause="isPlaying = false" class="w-full h-auto rotate-180" playsinline></video>

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
