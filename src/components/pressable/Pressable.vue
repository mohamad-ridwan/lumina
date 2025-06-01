<template>
  <div :class="[baseClass, isPressed ? pressedClass : '']" @touchstart="handlePress" @touchend="handleRelease"
    @mousedown="handlePress" @mouseup="handleRelease" @mouseleave="handleRelease" @touchcancel="handleRelease">
    <slot />
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  baseClass: {
    type: String,
    default: 'transition-all duration-150'
  },
  pressedClass: {
    type: String,
    default: 'bg-gray-300'
  }
})

const isPressed = ref(false)

function handlePress() {
  isPressed.value = true
}

function handleRelease() {
  isPressed.value = false
}
</script>
