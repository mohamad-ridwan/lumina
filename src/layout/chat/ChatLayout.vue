<script setup>
import Header from '@/sections/chat/Header.vue';
import SearchMessenger from '@/sections/chat/SearchMessenger.vue'
import { usersStore } from '@/stores/users';

const userStore = usersStore()
const { profile } = userStore

</script>

<template>
  <Header>
    <template #search>
      <SearchMessenger />
    </template>
  </Header>
</template>
