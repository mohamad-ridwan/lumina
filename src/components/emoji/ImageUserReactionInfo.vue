<script setup>
import VLazyImage from "v-lazy-image";
import { ref, toRefs, watch } from "vue";

const props = defineProps(['image'])

const { image } = toRefs(props)

const currentImageUrl = ref(props.image.imgCropped);

const handleImageError = () => {
  if (props.image?.thumbnail) {
    currentImageUrl.value = props.image.thumbnail
  }
}

watch(image.value.imgCropped, (newImageCropped) => {
  currentImageUrl.value = newImageCropped;
});
</script>

<template>
  <v-lazy-image :src="currentImageUrl" :src-placeholder="image?.thumbnail"
    class="rounded-full h-4.5 w-4.5 object-cover border border-white rotate-180" sizes="(max-width: 20px) 15px, 22px"
    @error="handleImageError" />
</template>

<style scoped>
.v-lazy-image {
  filter: blur(2px);
  transition: filter 0.1s;
}

.v-lazy-image-loaded {
  filter: blur(0);
}
</style>
