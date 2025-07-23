<script setup>
import { ordersStore } from '@/stores/orders';
import Header from '../Header.vue';
import OrderCard from '@/components/orders/OrderCard.vue';
import { storeToRefs } from 'pinia';

// orders store
const orderStore = ordersStore()
const { setActiveOrder } = orderStore
const { orders } = storeToRefs(orderStore)
</script>

<template>
  <Header title="Orders" @handle-back="() => setActiveOrder(false)" />
  <div v-for="(item, index) in orders.data" :key="index" class="p-2">
    <OrderCard :order="item" />
  </div>
</template>
