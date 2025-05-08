import { ref, onMounted, onUnmounted } from 'vue'

export function useKeyboardVisibility(onCloseCallback) {
  const initialHeight = ref(window.innerHeight)
  const isKeyboardOpen = ref(false)

  let timeoutId = null

  const handleResize = () => {
    const heightDiff = initialHeight.value - window.innerHeight
    const isNowOpen = heightDiff > 150 // 150px heuristik → keyboard muncul

    if (isNowOpen && !isKeyboardOpen.value) {
      isKeyboardOpen.value = true
    }

    if (!isNowOpen && isKeyboardOpen.value) {
      isKeyboardOpen.value = false
      if (typeof onCloseCallback === 'function') {
        // Beri jeda kecil biar stabil (kadang resize bounce)
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          onCloseCallback()
        }, 100)
      }
    }
  }

  onMounted(() => {
    window.addEventListener('resize', handleResize)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    clearTimeout(timeoutId)
  })

  return {
    isKeyboardOpen,
  }
}
