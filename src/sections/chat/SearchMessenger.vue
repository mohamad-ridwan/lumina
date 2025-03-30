<script setup>
// import
import Input from '@/components/Input.vue';
import { chatsStore } from '@/stores/chats';
import { ref } from 'vue';

// store
// chats store
const chatStore = chatsStore()
const { chats } = chatStore

// state
const searchValue = ref('')
</script>

<template>
  <Input v-model="searchValue" class-icon="left-3" icon="pi-search" input-class="!pl-8"
    placeholder="Search Messenger.." />
</template>
