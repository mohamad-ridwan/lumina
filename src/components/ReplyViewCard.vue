<script setup>
import { computed } from 'vue'
import VLazyImage from "v-lazy-image";

const { usernameClass, fromMessageUsername, wrapperClass, textMessage, textMessageClass, wrapperStyle, document } = defineProps(['usernameClass', 'fromMessageUsername', 'wrapperClass', 'textMessage', 'textMessageClass', 'wrapperStyle', 'document'])

const emits = defineEmits(['onClick'])

const memoizedTextMessage = computed(() => {
  if (!document) return textMessage
  if (document?.caption) return document.caption
})

</script>

<template>
  <div :class="`w-full flex items-start justify-between gap-2 pl-2 cursor-pointer ${wrapperClass}`"
    :style="wrapperStyle" @click="emits('onClick')">
    <div class="flex items-center gap-2">
      <div v-if="document?.type === 'image'">
        <v-lazy-image :src="`${document?.url}`" alt="reply" :src-placeholder="document?.thumbnail"
          class="h-10 w-15 max-w-full object-contain rounded-sm" sizes="(max-width: 60px) 40px, 60px" />
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
  filter: blur(10px);
  transition: filter 0.1s;
}

.v-lazy-image-loaded {
  filter: blur(0);
}
</style>
