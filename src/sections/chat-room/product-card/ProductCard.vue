<script setup>

import { computed, toRefs } from 'vue';
import Product from './Product.vue';
import 'vue3-carousel/carousel.css'

import { Carousel, Slide } from 'vue3-carousel'

const props = defineProps(['productData'])

const { productData } = toRefs(props)

// Computed property untuk menentukan pengaturan carousel atau fallback
const carouselItems = computed(() => {
  if (!productData.value || productData.value.length === 0) {
    return [];
  }
  // productData.value adalah array, langsung gunakan
  return productData.value;
});

const carouselSettings = {
  itemsToShow: 1, // Menampilkan 1.5 item di awal
  snapAlign: 'center', // Penjajaran slide
  // Lebih banyak setting bisa ditambahkan di sini
};

const breakpoints = {
  // 700px and up
  200: {
    itemsToShow: 1.5,
    snapAlign: 'start'
  },
  300: {
    itemsToShow: 2,
    snapAlign: 'start',
    gap: 0,
  },
  408: {
    itemsToShow: 2.5,
    snapAlign: 'start',
    gap: 5,
  },
  532: {
    itemsToShow: 3,
    snapAlign: 'start',
    gap: 5,
  },
  624: {
    itemsToShow: 3.5,
    snapAlign: 'start',
    gap: 5,
  },
  708: {
    itemsToShow: 3,
    snapAlign: 'start',
    gap: 5,
  },
  968: {
    itemsToShow: 3.5,
    snapAlign: 'start',
    gap: 5,
  },
  // 1024px and up
  1204: {
    itemsToShow: 4,
    snapAlign: 'start',
    gap: 10,
  },
};

</script>

<template>
  <div class="product-card-carousel-container rotate-180 pt-1" v-if="carouselItems.length > 0">
    <Carousel v-bind="carouselSettings" v-bind:wrap-around="false" :breakpoints="breakpoints" :wrap-around="true">
      <Slide v-for="(item, index) in carouselItems" :key="index">
        <div class="carousel-item-wrapper">
          <Product :product-data="item" />
          <!-- <template v-else-if="item.type === 'brand_image'">
            <div class="brand-image-item">
              <img :src="item.imageUrl || '/path/to/default/brand.png'" :alt="item.brandName + ' Logo'"
                class="brand-logo" />
              <p class="brand-name">{{ item.brandName }}</p>
            </div>
          </template> -->
        </div>
      </Slide>
    </Carousel>
  </div>
  <div v-else>
    <p>Tidak ada produk atau merek untuk ditampilkan.</p>
  </div>
</template>

<style scoped>
/* Styling untuk ProductCard.vue (Carousel Wrapper) */
.product-card-carousel-container {
  width: 100%;
  max-width: 800px;
  /* Sesuaikan lebar maksimum container carousel */
  border-radius: 8px;
  /* padding: 10px; */
}

.carousel-item-wrapper {
  box-sizing: border-box;
  width: 100%;
  /* Penting untuk padding */
}

/* Styling untuk brand image di dalam carousel */
.brand-image-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  /* Sesuaikan tinggi agar konsisten dengan product card */
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.brand-logo {
  max-width: 80%;
  max-height: 120px;
  object-fit: contain;
  margin-bottom: 10px;
}

.brand-name {
  font-weight: bold;
  color: #333;
  font-size: 1.1em;
}

/* Override atau sesuaikan styling vue3-carousel */
.carousel__slide {
  padding: 0 5px;
  /* Sesuaikan jarak antar slide */
}

.carousel__prev,
.carousel__next {
  box-sizing: content-box;
  border: 5px solid white;
}
</style>
