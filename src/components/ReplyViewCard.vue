<script setup>
const { usernameClass, fromMessageUsername, wrapperClass, textMessage, textMessageClass, wrapperStyle } = defineProps(['usernameClass', 'fromMessageUsername', 'wrapperClass', 'textMessage', 'textMessageClass', 'wrapperStyle'])

const emits = defineEmits(['onClick'])

</script>

<template>
  <div :class="`w-full flex items-start justify-between gap-2 pl-2 cursor-pointer ${wrapperClass}`"
    :style="wrapperStyle" @click="emits('onClick')">
    <div class="flex flex-col w-full pr-2">
      <h1 :class="`${usernameClass} font-semibold flex`">
        {{ fromMessageUsername }}
      </h1>
      <span :class="`text-xs line-clamp-2 font-light ${textMessageClass}`">{{ textMessage }}</span>
    </div>
  </div>
</template>
