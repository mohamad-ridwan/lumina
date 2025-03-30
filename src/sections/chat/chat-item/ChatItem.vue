<script setup>
import { Button } from 'primevue';

</script>

<template>
  <Button v-slot="slotProps" asChild type="button" severity="secondary" aria-label="chat">
    <div v-bind="slotProps"
      class="!w-full !h-[4rem] rounded-lg bg-[#f1f1f1] !flex gap-3 !items-center px-3 !justify-start !border-none">
      <img
        src="https://images.unsplash.com/photo-1611095564985-89765398121e?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        alt="" class="object-cover h-[50px] w-[50px] rounded-full">

      <div class="flex flex-col">
        <h1 class="font-bold text-[0.9rem] text-[#111827]">Roger</h1>
        <p class="gap-1 flex whitespace-nowrap max-w-[200px] text-[0.8rem] text-[#6b7280]">
          <span>You:</span>
          <span>Okay letsgo</span>
        </p>
      </div>
    </div>
  </Button>
</template>
