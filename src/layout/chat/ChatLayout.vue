<script setup>
import Header from '@/sections/chat/Header.vue';
import SearchMessenger from '@/sections/chat/SearchMessenger.vue'

</script>

<template>
  <Header>
    <template #search>
      <SearchMessenger />
    </template>
  </Header>
</template>
