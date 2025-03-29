<script setup>
import { theme } from '@/assets/theme';
import Button from 'primevue/button';
</script>

<template>
  <div class="flex flex-col pt-4 px-4 pb-3 gap-5">
    <div class="flex w-full justify-between items-center">
      <h1 class="font-bold text-lg">Chats</h1>
      <Button icon="pi pi-plus" aria-label="Chat" :class="theme.regularBtn" size="small" icon-class="!text-xs" />
    </div>
    <slot name="search"></slot>
  </div>

</template>
