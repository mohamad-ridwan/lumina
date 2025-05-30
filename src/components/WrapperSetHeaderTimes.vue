<script setup>
const { item } = defineProps(['item'])
const emits = defineEmits(['setHeaderRef'])

const setHeader = (el) => {
  emits('setHeaderRef', el, item)
}
</script>

<template>
  <div :key="item.id" :id="`${item.id}-${item.latestMessageTimestamp}`" :data-timestamp="item.latestMessageTimestamp">
    <slot />
  </div>
</template>
