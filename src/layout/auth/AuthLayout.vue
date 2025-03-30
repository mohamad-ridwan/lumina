<script setup>
const { title, desc } = defineProps({
  title: {
    type: String
  },
  desc: {
    type: String
  }
})
</script>

<template>
  <div class="flex min-h-screen">
    <div class="flex w-full md:w-[50%] justify-center">
      <div class="w-[80%] md:min-w-[350px] pt-[10%] pb-[5%] flex flex-col gap-6">
        <div class="flex flex-col gap-2">
          <img src="/public/logo.png" alt="" class="max-w-[100px] object-cover">
          <h1 class="font-bold text-2xl">{{ title }}</h1>
          <span class="text-sm text-[#6b7280]">{{ desc }}</span>
        </div>
        <div>
          <slot name="form-side"></slot>
        </div>
      </div>
    </div>
    <div class="hidden w-[50%] justify-center md:flex">
      <div :class="`w-full flex bg-[#2e74e8] justify-center items-center`">
        <img src="../../assets/images/auth.png" class="w-full max-w-[600px] object-contain" alt="">
      </div>
    </div>
  </div>
</template>
