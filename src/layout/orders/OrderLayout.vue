<script setup>
import { ordersStore } from '@/stores/orders';
import Header from '../Header.vue';
import OrderCard from '@/components/orders/OrderCard.vue';
import { storeToRefs } from 'pinia';
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller';

// orders store
const orderStore = ordersStore()
const { setActiveOrder } = orderStore
const { orders } = storeToRefs(orderStore)
</script>

<template>
  <Header title="Orders" @handle-back="() => setActiveOrder(false)" />
  <div class="flex flex-col flex-1 max-h-dvh pb-13 overflow-hidden relative">
    <DynamicScroller :items="orders?.data" :min-item-size="150" key-field="orderId" :key="item?.orderId"
      class="p-2 flex flex-col">
      <template v-slot="{ item, index, active }">
        <DynamicScrollerItem :item="item" :data-index="index" :active="active">
          <div class="pb-2">
            <OrderCard :order="item" :key="item?.orderId" />
          </div>
        </DynamicScrollerItem>
      </template>
    </DynamicScroller>
  </div>
</template>
