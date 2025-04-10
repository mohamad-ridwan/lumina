<template>
  <Button v-slot="slotProps" asChild type="button" severity="secondary" aria-label="chat">
    <div v-bind="slotProps"
      class="w-full rounded-lg px-3 flex items-center gap-3 !justify-between !border-none h-16 bg-[#f1f1f1] animate-pulse">

      <div class="flex items-center gap-3 min-w-0 w-[80%]">
        <div class="w-12 sm:w-14">
          <div class="relative h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-gray-300"></div>
        </div>

        <div class="flex flex-col w-full gap-2">
          <div class="font-bold truncate bg-gray-300 rounded-md h-3 w-[30%]"></div>

          <div class="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 w-full truncate mt-1">
            <span class="bg-gray-300 rounded-md h-2 w-[50%]"></span>
          </div>
        </div>
      </div>

      <div class="flex flex-col items-center gap-1 flex-shrink-0">
        <span class="text-[10px] bg-gray-300 rounded-md h-2 w-10"></span>

        <div class="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-gray-300 flex justify-center items-center mt-1">
          <span
            class="text-white font-semibold rounded-full flex items-center justify-center text-[10px] sm:text-[12px] px-2 h-3"></span>
        </div>
      </div>

    </div>
  </Button>
</template>

<script setup>
import { Button } from 'primevue';

// Tidak ada props atau logika khusus untuk skeleton
</script>

<style scoped>
/* Animasi pulse bawaan Tailwind CSS */
</style>
