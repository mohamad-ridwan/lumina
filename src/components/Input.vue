<script setup>
import { InputText } from 'primevue';

// model props
const inputModel = defineModel()
// props
const { icon, classIcon, inputClass, placeholder, pyInput, fontSizeInput } = defineProps(['icon', 'classIcon', 'inputClass', 'placeholder', 'pyInput', 'fontSizeInput'])
</script>

<template>
  <div class="relative items-center flex">
    <i :class="`pi ${icon} absolute text-gray-500 !text-[0.8rem] ${classIcon}`"></i>
    <InputText type="text" v-model="inputModel" :placeholder="placeholder" fluid
      :class="`!border-none !outline-none !shadow-none !bg-[#f1f1f1] ${fontSizeInput ?? '!text-sm'} !text-[#6b7280] placeholder:!text-[#6b7280] ${pyInput ?? '!py-2.5'} ${inputClass}`" />
  </div>
</template>
