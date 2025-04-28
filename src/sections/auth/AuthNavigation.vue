<script setup>
import { theme } from '@/assets/theme'
import { useRouter } from 'vue-router'

const { btnName, desc, path, justify = 'justify-center' } = defineProps(['btnName', 'desc', 'path', 'justify'])

const router = useRouter()

const handleNavigate = () => {
  router.push(path)
}
</script>

<template>
  <div :class="`flex flex-wrap gap-1 w-full ${justify} pt-4`">
    <span :class="`text-xs text-[${theme.secondary.main}]`">{{ desc }}</span>
    <button type="button" @click="handleNavigate"
      :class="`text-[${theme.primary.main}] hover:text-[${theme.primary.hover}] cursor-pointer text-xs font-semibold`">{{
        btnName
      }}</button>
  </div>
</template>
