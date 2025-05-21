<script setup>
import { usersStore } from '@/stores/users';
import { onMounted } from 'vue';
import Header from '@/sections/profile/Header.vue';
import Picture from '@/sections/profile/Picture.vue';
import ImageLightBox from '@/components/media/ImageLightBox.vue';

// users store
const userStore = usersStore()
const { setActiveProfile } = userStore
// chat room store

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

</script>

<template>
  <!-- MEDIA -->
  <ImageLightBox />
  <Header />
  <Picture />
</template>
