<script setup>
import { computed, toRefs } from 'vue';
import OrderCard from './OrderCard.vue';
import 'vue3-carousel/carousel.css'
import { Carousel, Slide } from 'vue3-carousel'

const props = defineProps(['orderData'])
const { orderData } = toRefs(props)

const carouselItems = computed(() => {
  if (!orderData.value || orderData.value.length === 0) {
    return [];
  }
  // orderData.value adalah array, langsung gunakan
  return orderData.value.map(order => {
    const status = () => {
      if (order.status === 'pending') {
        return 'Menunggu Pembayaran';
      } else if (order.status === 'processing') {
        return 'Diproses';
      } else if (order.status === 'shipped') {
        return 'Dikirim';
      } else if (order.status === 'delivered') {
        return 'Selesai';
      } else if (order.status === 'cancelled') {
        return 'Dibatalkan';
      }
    }
    return {
      ...order,
      status: status()
    }
  })
});

const carouselSettings = {
  itemsToShow: 1, // Menampilkan 1.5 item di awal
  snapAlign: 'center', // Penjajaran slide
  // Lebih banyak setting bisa ditambahkan di sini
};

const breakpoints = {
  // 700px and up
  200: {
    itemsToShow: 1,
    snapAlign: 'start',
    gap: 5,
  },
  380: {
    itemsToShow: 1.3,
    snapAlign: 'start',
    gap: 5,
  },
  480: {
    itemsToShow: 1.5,
    snapAlign: 'start',
    gap: 5,
  },
  680: {
    itemsToShow: 2,
    snapAlign: 'start',
    gap: 5,
  },
  780: {
    itemsToShow: 1.5,
    snapAlign: 'start',
    gap: 5,
  },
  1024: {
    itemsToShow: 2,
    snapAlign: 'start',
    gap: 5,
  },
  1500: {
    itemsToShow: 2.5,
    snapAlign: 'start',
    gap: 5,
  },
  2000: {
    itemsToShow: 3,
    snapAlign: 'start',
    gap: 5,
  },
};
</script>

<template>
  <div class="orders-carousel-container rotate-180 pt-1" v-if="carouselItems.length > 0">
    <Carousel v-bind="carouselSettings" v-bind:wrap-around="false" :breakpoints="breakpoints" :wrap-around="true">
      <Slide v-for="(item, index) in carouselItems" :key="index">
        <div class="carousel-item-wrapper">
          <OrderCard :order="item" />
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
.orders-carousel-container {
  width: 100%;
  max-width: 1200px;
  /* Sesuaikan lebar maksimum container carousel */
  border-radius: 8px;
  /* padding: 10px; */
}

.carousel-item-wrapper {
  box-sizing: border-box;
  width: 100%;
  /* Penting untuk padding */
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
