<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  order: {
    type: Object,
    required: true,
    validator: (value) => {
      // Basic validation for essential properties
      return (
        value.orderId &&
        value.status &&
        value.totalAmount !== undefined &&
        value.orderedAt &&
        Array.isArray(value.items)
      );
    },
  },
});

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('id-ID', options);
};

const formatStatus = (status) => {
  if (!status) return 'N/A';
  return status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ');
};

const getStatusClass = (status) => {
  switch (status) {
    case 'Menunggu Pembayaran':
      return 'text-yellow-600';
    case 'Diproses':
      return 'text-blue-800';
    case 'Dikirim':
      return 'text-indigo-800';
    case 'Selesai':
      return 'text-green-800';
    case 'Dibatalkan':
      return 'text-red-800';
    default:
      return 'text-gray-800';
  }
};

const formatVariantOptions = (options) => {
  if (!options) return '';
  return Object.entries(options)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');
};
</script>

<template>
  <div class="bg-white rounded-lg shadow-xs p-3 mb-4 border border-gray-200 flex flex-col gap-2">
    <div class="flex justify-between items-center gap-1 w-full">
      <h3 class="text-xs font-semibold text-gray-800">
        Pesanan #{{ order.orderId }}
      </h3>
      <div class="flex justify-end min-w-[100px]">
        <span :class="[
          'text-xs font-medium text-end',
          getStatusClass(order.status),
        ]">
          {{ formatStatus(order.status) }}
        </span>
      </div>
    </div>

    <div class="text-xs text-gray-600 mb-3 flex flex-col">
      <p class="mb-1">
        <span class="font-medium">Tanggal Pesanan:</span>
        {{ formatDate(order.orderedAt) }}
      </p>
      <p class="mb-1">
        <span class="font-medium">Total:</span>
        {{ formatCurrency(order.totalAmount) }}
      </p>
      <p v-if="order.shippingAddress" class="mb-1">
        <span class="font-medium">Penerima:</span>
        {{ order.shippingAddress.fullName }}
      </p>
    </div>

    <div class="mb-3 flex flex-col">
      <ul class="text-sm text-gray-600 flex flex-col gap-2">
        <li v-for="item in order.items.slice(0, 2)" :key="item._id" class="mb-1">
          <div class="flex items-center gap-2">
            <img v-if="item.variant" :src="item.variant?.imageUrl ?? '/no-image.jpg'" alt="Product Image"
              class="w-10 h-10 object-cover rounded" />
            <img v-else-if="item.shoe" :src="item.shoe?.imageUrl ?? '/no-image.jpg'" alt="Product Image"
              class="w-10 h-10 object-cover rounded" />
            <div class="text-xs">
              <span class="font-medium">{{ item.name }}</span>
              <span v-if="item.variant && item.variant.optionValues">
                ({{ formatVariantOptions(item.variant.optionValues) }})
              </span>
              x {{ item.quantity }} - {{ formatCurrency(item.price) }}/unit
            </div>
          </div>
        </li>
      </ul>
    </div>

    <div class="w-full flex justify-end">
      <a :href="order.publicOrderUrl" target="_blank"
        class="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-xs mt-2">
        Lihat Detail Pesanan
        <svg class="ml-1 w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
        </svg>
      </a>
    </div>
  </div>
</template>

<style scoped>
/* Anda bisa menambahkan style khusus di sini jika diperlukan,
   tapi sebagian besar sudah ditangani oleh Tailwind CSS */
</style>
