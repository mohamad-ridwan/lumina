<template>
  <Dialog :visible="isVisible" modal closable :hide="handleHide" @update:visible="$emit('update:isVisible', $event)"
    :header="modalHeader" :breakpoints="{ '960px': '75vw', '640px': '90vw' }" :style="{ width: '50vw' }">
    <div v-if="order" class="p-4 overflow-y-auto max-h-[70vh]">
      <div class="mb-6 border-b pb-4">
        <h3 class="text-lg font-semibold text-gray-800 mb-2">Ringkasan Pesanan</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-700">
          <p>
            <span class="font-medium">Order ID:</span> {{ order.orderId }}
          </p>
          <p>
            <span class="font-medium">Status:</span>
            <span :class="getStatusClass(order.status)">
              {{ formatStatus(order.status) }}
            </span>
          </p>
          <p>
            <span class="font-medium">Total Jumlah:</span>
            {{ formatCurrency(order.totalAmount) }}
          </p>
          <p>
            <span class="font-medium">Tanggal Pesan:</span>
            {{ formatDate(order.orderedAt) }}
          </p>
          <p>
            <span class="font-medium">Metode Pembayaran:</span>
            {{ order.paymentMethod || 'N/A' }}
          </p>
          <p v-if="order.notes">
            <span class="font-medium">Catatan:</span> {{ order.notes }}
          </p>
        </div>
      </div>

      <div class="mb-6 border-b pb-4">
        <h3 class="text-lg font-semibold text-gray-800 mb-3">Detail Produk</h3>
        <ul class="space-y-4">
          <li v-for="item in order.items" :key="item._id"
            class="flex items-start space-x-4 p-3 border rounded-lg bg-gray-50">
            <img :src="item.variant?.imageUrl || item.shoe?.imageUrl || 'https://via.placeholder.com/80'"
              alt="Product Image" class="w-20 h-20 object-cover rounded-md flex-shrink-0" />
            <div class="flex-grow">
              <p class="font-medium text-gray-900 text-base">{{ item.name }}</p>
              <p v-if="item.variant" class="text-sm text-gray-600">
                {{ formatVariantOptions(item.variant.optionValues) }}
              </p>
              <p class="text-sm text-gray-700 mt-1">
                {{ item.quantity }} x {{ formatCurrency(item.price) }} =
                <span class="font-semibold">{{ formatCurrency(item.quantity * item.price) }}</span>
              </p>
            </div>
          </li>
        </ul>
      </div>

      <div v-if="order.shippingAddress" class="mb-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-3">Alamat Pengiriman</h3>
        <div class="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border">
          <p><span class="font-medium">Nama:</span> {{ order.shippingAddress.fullName }}</p>
          <p><span class="font-medium">Jalan:</span> {{ order.shippingAddress.street }}</p>
          <p><span class="font-medium">Kota:</span> {{ order.shippingAddress.city }}, {{ order.shippingAddress.province
          }}</p>
          <p><span class="font-medium">Kode Pos:</span> {{ order.shippingAddress.postalCode }}</p>
          <p><span class="font-medium">Telepon:</span> {{ order.shippingAddress.phoneNumber }}</p>
          <p><span class="font-medium">Email:</span> {{ order.shippingAddress.email }}</p>
        </div>
      </div>
      <div class="flex justify-end items-center gap-2 pt-2">
        <Button icon="pi pi-times" severity="danger" label="Tidak Setuju" size="small" class="!text-xs" />
        <Button icon="pi pi-check" severity="success" size="small" class="!text-xs" label="Setuju" />
      </div>
    </div>
    <div v-else class="p-4 text-center text-gray-500">
      <p>Memuat detail pesanan atau tidak ada data yang tersedia.</p>
    </div>
  </Dialog>
</template>

<script setup>
import { Button, Dialog } from 'primevue';
import { defineProps, defineEmits, computed } from 'vue';
// Jika Dialog tidak didaftarkan secara global, impor di sini
// import Dialog from 'primevue/dialog';

const props = defineProps({
  isVisible: {
    type: Boolean,
    required: true,
  },
  order: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['hide', 'update:isVisible'])

const handleHide = () => {
  emit('hide')
}

const modalHeader = computed(() => {
  return props.order ? `Detail Pesanan #${props.order.orderId}` : 'Detail Pesanan';
});

// --- Helper Functions (sama seperti di OrderCard.vue) ---
const formatCurrency = (amount) => {
  if (typeof amount !== 'number') return 'N/A';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(dateString).toLocaleDateString('id-ID', options);
};

const formatStatus = (status) => {
  if (!status) return 'N/A';
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/-/g, ' ');
};

const getStatusClass = (status) => {
  switch (status) {
    case 'pending':
      return 'inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800';
    case 'processing':
      return 'inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800';
    case 'shipped':
      return 'inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800';
    case 'delivered':
      return 'inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800';
    case 'cancelled':
      return 'inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-800';
    case 'Permintaan Membatalkan': // Menambahkan status khusus ini
      return 'inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-orange-100 text-orange-800';
    default:
      return 'inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-800';
  }
};

const formatVariantOptions = (options) => {
  if (!options) return '';
  return Object.entries(options)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');
};
</script>

<style scoped>
/* Anda bisa menambahkan style kustom di sini jika diperlukan */
/* Contoh untuk memastikan gambar produk tetap proporsional */
img {
  max-width: 100%;
  height: auto;
}
</style>
