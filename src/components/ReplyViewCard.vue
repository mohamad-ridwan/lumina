<script setup>
import { computed, ref, toRefs, watch } from 'vue'
import VLazyImage from "v-lazy-image";

const props = defineProps(['usernameClass', 'fromMessageUsername', 'wrapperClass', 'textMessage', 'textMessageClass', 'wrapperStyle', 'document'])

const { usernameClass, fromMessageUsername, wrapperClass, textMessage, textMessageClass, wrapperStyle, document } = toRefs(props)

const emits = defineEmits(['onClick'])

const currentImageUrl = ref(document.value?.type === 'image' ? document.value?.url : document.value?.poster);

const memoizedTextMessage = computed(() => {
  if (!document.value) return textMessage.value
  if (document.value?.caption) return document.value.caption
})

const handleImageError = () => {
  if (document.value?.thumbnail) {
    currentImageUrl.value = document.value.thumbnail
  }
}

watch(() => [document.value?.url, document.value?.poster], ([newUrl, poster]) => {
  if (document.value?.type === 'image' && newUrl) {
    currentImageUrl.value = newUrl
  } else if (document.value?.type === 'video' && poster) {
    currentImageUrl.value = poster
  }
});

</script>

<template>
  <div :class="`w-full flex items-start justify-between gap-2 pl-2 cursor-pointer ${wrapperClass}`"
    :style="wrapperStyle" @click="emits('onClick')">
    <div class="flex items-center gap-2">
      <div v-if="document?.type === 'image' || document?.type === 'video'">
        <v-lazy-image :src="currentImageUrl" alt="reply"
          :src-placeholder="document.type === 'image' ? document?.thumbnail : undefined"
          class="h-10 w-15 max-w-full object-contain rounded-sm" sizes="(max-width: 60px) 40px, 60px"
          @error="handleImageError" />
      </div>
      <div class="flex flex-col w-full pr-2">
        <h1 :class="`${usernameClass} font-semibold flex`">
          {{ fromMessageUsername }}
        </h1>
        <span :class="`text-xs line-clamp-2 font-light ${textMessageClass}`">{{ memoizedTextMessage }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.v-lazy-image {
  filter: blur(1px);
  transition: filter 0.1s;
}

.v-lazy-image-loaded {
  filter: blur(0);
}
</style>
