<script setup>
import { computed } from 'vue';
import VLazyImage from "v-lazy-image";
import { Button } from 'primevue';

const props = defineProps({
  productData: {
    type: Object,
    required: true,
    validator: (value) => {
      // Pastikan ada properti dasar yang diharapkan dari product_card
      return value && typeof value.name === 'string' && typeof value.brand === 'string';
    }
  }
});

// Computed property untuk format data
const formattedProduct = computed(() => {
  const data = props.productData;

  // Menggabungkan array menjadi string untuk tampilan
  const sizeString = Array.isArray(data.size) && data.size.length > 0
    ? data.size.join(', ')
    : (typeof data.size === 'string' ? data.size : 'N/A'); // Handle jika size sudah string

  const categoryString = Array.isArray(data.category) && data.category.length > 0
    ? data.category.join(', ')
    : (typeof data.category === 'string' ? data.category : null); // Handle jika category sudah string

  return {
    name: data.name || 'Nama Tidak Tersedia',
    brand: data.brand || 'Brand Tidak Tersedia',
    variant: data.variant || null,
    size: sizeString,
    price: data.price ? `Rp ${data.price.toLocaleString('id-ID')}` : 'Harga tidak tersedia',
    stock: data.stock !== undefined ? `${data.stock} (${data.quantity} unit)` : 'Stok tidak tersedia',
    category: categoryString,
    image: data.image || '/path/to/default/product.png' // Pastikan nama field image sesuai
  };
});
</script>

<template>
  <div class="product-item-card relative overflow-hidden h-fit">
    <div v-if="formattedProduct?.image" class="h-[120px] w-full">
      <v-lazy-image :src="formattedProduct.image" :alt="formattedProduct.name" class="h-full w-full object-cover" />
    </div>
    <div class="product-details pt-2 px-2">
      <h3 class="text-xs sm:text-sm" v-if="formattedProduct?.name">{{ formattedProduct.name }}</h3>
      <p class="text-[0.65rem] sm:text-xs" v-if="formattedProduct?.price"><strong>{{ formattedProduct.price }}</strong>
      </p>
    </div>
    <div class="p-2 flex-shrink-0">
      <Button label="Buy Now" class="w-full p-button-sm p-button-success !bg-[#000124] !border-none !outline-none"
        :disabled="formattedProduct?.stock === 'Stok tidak tersedia' || formattedProduct?.stock === '0 (0 unit)'" />
    </div>
  </div>
</template>

<style scoped>
/* Styling untuk Product.vue (Individual Product Card) */
.product-item-card {
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  /* Sesuaikan margin untuk jarak antar kartu di carousel */
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  text-align: center;
  width: 100%;
  /* Agar memenuhi slide carousel */
  box-sizing: border-box;
  /* Berikan tinggi tetap untuk konsistensi */
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.product-details {
  flex-grow: 1;
  /* Agar mengisi ruang yang tersedia */
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  /* Teks rata kiri */
  text-align: left;
  width: 100%;
}

.product-details h3 {
  margin-top: 0;
  margin-bottom: 8px;
  color: #333;
  line-height: 1.2;
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-details p {
  margin: 3px 0;
  color: #555;
  width: 100%;
  /* Tambahkan ellipsis jika teks terlalu panjang */
}

/* Optional: styling untuk bold di p */
.product-details p strong {
  color: #222;
}
</style>
