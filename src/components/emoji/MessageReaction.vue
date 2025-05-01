<script setup>
import { Button } from 'primevue'

const { wrapperClass } = defineProps(['wrapperClass'])
</script>

<template>
  <div :class="`group/emoji flex w-full items-center relative gap-1.5 ${wrapperClass}`">
    <!-- Satu tombol emoji -->
    <Button icon="pi pi-face-smile" text rounded size="small"
      class="!w-7 !h-7 flex items-center justify-center absolute opacity-0 group-hover/emoji:opacity-100 transition-opacity duration-200 !bg-[#A1A1A1] shadow border rotate-180 !text-white" />

    <slot />
  </div>
</template>
