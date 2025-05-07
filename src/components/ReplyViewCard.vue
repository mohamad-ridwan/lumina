<script setup>
import { computed } from 'vue'

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
      <div v-if="document?.type === 'image'"><img :src="document.url" alt="reply"
          class="h-10 w-15 max-w-full object-contain rounded-sm"></div>
      <div class="flex flex-col w-full pr-2">
        <h1 :class="`${usernameClass} font-semibold flex`">
          {{ fromMessageUsername }}
        </h1>
        <span :class="`text-xs line-clamp-2 font-light ${textMessageClass}`">{{ memoizedTextMessage }}</span>
      </div>
    </div>
  </div>
</template>
