<!-- components/ImageLightbox.vue -->
<script setup>
import { useChatRoomStore } from '@/stores/chat-room'
import { storeToRefs } from 'pinia'
import { Button } from 'primevue'
import { computed, ref, watch } from 'vue'
import VueEasyLightbox from 'vue-easy-lightbox'
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import isToday from 'dayjs/plugin/isToday';
import isYesterday from 'dayjs/plugin/isYesterday';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import weekday from 'dayjs/plugin/weekday';
import { general } from '@/helpers/general'

dayjs.extend(isToday);
dayjs.extend(isYesterday);
dayjs.extend(weekOfYear);
dayjs.extend(weekday);

const { formatDate } = general

const chatRoomStore = useChatRoomStore()
const { handleResetActiveMediaData } = chatRoomStore
const { activeMediaData } = storeToRefs(chatRoomStore)

const visible = ref(false)

const images = computed(() => {
  if (!activeMediaData.value) return []
  return [activeMediaData.value.url]
})

const date = computed(() => {
  if (!activeMediaData.value || !activeMediaData.value?.latestMessageTimestamp) return ''
  const itemDate = dayjs(Number(activeMediaData.value?.latestMessageTimestamp)).startOf('day')
  return `${formatDate(itemDate)} at ${activeMediaData.value.hours}`
})

watch(activeMediaData, (data) => {
  if (data) {
    visible.value = true
  } else {
    visible.value = false
  }
})

const onHide = () => {
  visible.value = false
  handleResetActiveMediaData()
}
</script>

<template>
  <vue-easy-lightbox :visible="visible" :imgs="images" :index="0" @hide="onHide" />

  <div v-if="visible"
    class="fixed top-0 left-0 w-full flex items-center justify-between bg-black/60 text-white text-lg py-2 px-4 z-[10000]">
    <!-- Username -->
    <div class="flex flex-col">
      <span class="font-semibold">{{ activeMediaData.username }}</span>
      <span v-if="date" class="text-sm text-gray-300">{{ date }}</span>
    </div>

    <!-- Close button (PrimeVue Button) -->
    <Button icon="pi pi-times" severity="secondary" text rounded
      class="p-2 !text-white hover:bg-white/20 border-none hover:!text-gray-500" @click="onHide" />
  </div>
</template>

<style>
.vel-btns-wrapper .btn__close {
  display: none;
}
</style>
