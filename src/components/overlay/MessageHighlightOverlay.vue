<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  trigger: {
    type: Boolean,
    required: true,
  },
  duration: {
    type: Number,
    default: 700, // dalam ms
  },
})

const show = ref(false)

watch(
  () => props.trigger,
  (newVal) => {
    if (newVal) {
      show.value = true
      setTimeout(() => {
        show.value = false
      }, props.duration)
    }
  },
  { immediate: true }
)
</script>

<template>
  <transition name="fade-highlight">
    <div v-if="show" class="absolute inset-0 bg-black rounded-2xl opacity-40 pointer-events-none z-[2]"></div>
  </transition>
</template>

<style scoped>
.fade-highlight-enter-active,
.fade-highlight-leave-active {
  transition: opacity 0.5s ease;
}

.fade-highlight-enter-from,
.fade-highlight-leave-to {
  opacity: 0;
}

.fade-highlight-enter-to,
.fade-highlight-leave-from {
  opacity: 0.4;
}
</style>
