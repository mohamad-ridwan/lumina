import { defineStore } from 'pinia'
import { ref } from 'vue'

export const ordersStore = defineStore('orders', () => {
  const activeOrder = ref(false)

  function setActiveOrder(isActive) {
    activeOrder.value = isActive
  }

  return {
    setActiveOrder,
    activeOrder,
  }
})
