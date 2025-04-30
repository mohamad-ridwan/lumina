// composables/useClickOutside.js
import { onMounted, onBeforeUnmount } from 'vue'

export function useClickOutside(targetRef, callback) {
  const handler = (event) => {
    if (!targetRef.value) return

    // Kalau klik bukan di dalam elemen targetRef
    if (!targetRef.value.contains(event.target)) {
      callback(event)
    }
  }

  onMounted(() => {
    document.addEventListener('click', handler)
    document.addEventListener('touchstart', handler) // Untuk mobile touch
  })

  onBeforeUnmount(() => {
    document.removeEventListener('click', handler)
    document.removeEventListener('touchstart', handler)
  })
}
