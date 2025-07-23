<script setup>
import { ordersStore } from '@/stores/orders';
import { storeToRefs } from 'pinia';
import OrderLayout from './OrderLayout.vue';


// orders store
const orderStore = ordersStore()
const { activeOrder } = storeToRefs(orderStore)
</script>

<template>
  <div v-if="activeOrder" class="flex flex-col gap-2 relative h-dvh w-full">
    <div class="flex-1 flex-col flex w-full bg-[#F1F1F1]">
      <OrderLayout />
    </div>
  </div>
</template>
