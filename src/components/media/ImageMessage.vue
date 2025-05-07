<script setup>
const { url, imgClass } = defineProps(['url', 'imgClass'])
</script>

<template>
  <div>
    <img :src="url" loading="lazy" class="max-w-full max-h-64 object-cover rounded-sm rotate-180 bg-gray-500/70"
      :class="imgClass" />
  </div>
</template>
