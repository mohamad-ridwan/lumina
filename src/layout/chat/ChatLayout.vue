<script setup>
import Header from '@/sections/chat/Header.vue';
import SearchMessenger from '@/sections/chat/SearchMessenger.vue'
import { socket } from '@/services/socket/socket';
import { onMounted, onUnmounted } from 'vue';

onMounted(() => {
  socket.emit('connection')
})

onUnmounted(() => {
  socket.emit('disconnect')
})

</script>

<template>
  <Header>
    <template #search>
      <SearchMessenger />
    </template>
  </Header>
</template>
