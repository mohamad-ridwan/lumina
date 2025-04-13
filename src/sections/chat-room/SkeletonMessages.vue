<template>
  <div class="flex flex-col-reverse overflow-y-auto p-4 flex-1">
    <div class="flex flex-col gap-5">
      <div class="flex justify-end flex-col items-end gap-2">
        <div
          class="bg-gray-300 rotate-180 rounded-tr-md rounded-br-md rounded-bl-lg h-16 w-1/3 animate-pulse delay-100">
        </div>
        <div class="bg-gray-300 rounded-md h-3 w-16 mt-1.5 animate-pulse delay-200"></div>
      </div>
      <div class="flex justify-end flex-col items-end gap-2">
        <div
          class="bg-gray-300 rotate-180 rounded-tr-md rounded-br-md rounded-bl-lg h-10 w-1/4 animate-pulse delay-300">
        </div>
        <div class="bg-gray-300 rounded-md h-3 w-12 mt-1.5 animate-pulse delay-400"></div>
      </div>

      <div class="flex justify-start flex-col items-start gap-2">
        <div
          class="bg-gray-300 rotate-180 rounded-tl-md rounded-bl-md rounded-br-lg h-24 w-1/4 animate-pulse delay-600">
        </div>
        <div class="bg-gray-300 rounded-md h-3 w-16 mt-1.5 animate-pulse delay-700"></div>
      </div>
      <div class="flex justify-start flex-col items-start gap-2">
        <div
          class="bg-gray-300 rotate-180 rounded-tl-md rounded-bl-md rounded-br-lg h-14 w-1/6 animate-pulse delay-800">
        </div>
        <div class="bg-gray-300 rounded-md h-3 w-12 mt-1.5 animate-pulse delay-900"></div>
      </div>

      <div class="flex justify-end flex-col items-end gap-2">
        <div class="bg-gray-300 rotate-180 rounded-tr-md rounded-br-md rounded-bl-lg h-8 w-1/5 animate-pulse delay-100">
        </div>
        <div class="bg-gray-300 rounded-md h-3 w-16 mt-1.5 animate-pulse delay-200"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Tidak ada props atau logika khusus untuk skeleton chat room
</script>

<style scoped>
/* Animasi pulse bawaan Tailwind CSS */
.animate-pulse {
  animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}
</style>
