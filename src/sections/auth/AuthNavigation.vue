<script setup>
import { theme } from '@/assets/theme'

const { btnName } = defineProps(['btnName'])
</script>

<template>
  <div class="flex flex-wrap gap-1 w-full justify-center pt-4">
    <span :class="`text-xs text-[${theme.secondary.main}]`">Don't have an account?</span>
    <button type="button"
      :class="`text-[${theme.primary.main}] hover:text-[${theme.primary.hover}] cursor-pointer text-xs font-semibold`">{{
        btnName
      }}</button>
  </div>
</template>
