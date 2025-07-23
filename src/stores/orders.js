import { defineStore } from 'pinia'
import { ref } from 'vue'

export const ordersStore = defineStore('orders', () => {
  const activeOrder = ref(false)
  const orders = ref({
    data: [],
    pagination: null,
  })

  function setActiveOrder(isActive) {
    activeOrder.value = isActive
  }

  function resetOrders() {
    orders.value = {
      data: [],
      pagination: null,
    }
  }

  return {
    setActiveOrder,
    activeOrder,
    orders,
    resetOrders,
  }
})
