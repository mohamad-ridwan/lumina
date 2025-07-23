<script setup>
import { usersStore } from '@/stores/users';
import { onMounted, onUnmounted } from 'vue';
import Picture from '@/sections/profile/Picture.vue';
import ImageLightBox from '@/components/media/MediaLightBox.vue';
import UpdateUsername from '@/sections/profile/UpdateUsername.vue';
import { useChatRoomStore } from '@/stores/chat-room';
import { storeToRefs } from 'pinia';
import Header from '../Header.vue';

// users store
const userStore = usersStore()
const { setActiveProfile } = userStore
// chat room store
const chatRoomStore = useChatRoomStore()
const { handleResetActiveMediaData } = chatRoomStore
const { lightboxEl, galleryInstance } = storeToRefs(chatRoomStore)

const preventBackNavigation = () => {
  setActiveProfile(false)
  setTimeout(() => {
    history.pushState(null, "", window.location.href)
  }, 100)
}

function handleBeforeUnload() {
  setActiveProfile(false)
}


onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload);
  history.pushState(null, "", window.location.href)
  window.addEventListener('popstate', preventBackNavigation)
});

onUnmounted(() => {
  galleryInstance.value?.destroy?.(true)
  lightboxEl.value = null
  galleryInstance.value = null
  handleResetActiveMediaData()
})

</script>

<template>
  <!-- MEDIA -->
  <ImageLightBox />

  <Header title="Profile" @handle-back="() => setActiveProfile(false)" />
  <Picture />
  <UpdateUsername />
</template>
