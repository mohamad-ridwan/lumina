<script setup>
const { item } = defineProps(['item'])
const emits = defineEmits(['setHeaderRef'])

const setHeader = (el) => {
  emits('setHeaderRef', el, item)
}
</script>

<template>
  <div :id="`${item.id}-${item.latestMessageTimestamp}`" :ref="setHeader" :data-timestamp="item.latestMessageTimestamp">
    <slot />
  </div>
</template>
