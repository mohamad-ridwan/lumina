import { defineStore } from 'pinia'
import { ref, triggerRef } from 'vue'

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

  function updateAgendaJobOrder(orderId) {
    orders.value.data = orders.value.data.filter((order) => order.orderId !== orderId)
    orders.value.pagination.totalOrders = orders.value.pagination.totalOrders - 1
    triggerRef(orders)
  }

  return {
    setActiveOrder,
    activeOrder,
    orders,
    resetOrders,
    updateAgendaJobOrder,
  }
})
