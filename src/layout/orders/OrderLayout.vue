<script setup>
import { ordersStore } from '@/stores/orders';
import Header from '../Header.vue';

// orders store
const orderStore = ordersStore()
const { setActiveOrder } = orderStore
</script>

<template>
  <Header title="Orders" @handle-back="() => setActiveOrder(false)" />
</template>
