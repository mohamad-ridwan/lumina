<script setup>
// import
import { chatsStore } from '@/stores/chats';
import { InputText } from 'primevue';
import { ref } from 'vue';

// store
// chats store
const chatStore = chatsStore()
const { chats } = chatStore

// state
const searchValue = ref('')
</script>

<template>
  <div class="relative items-center flex">
    <i class="pi pi-search absolute text-gray-500 left-3 !text-[0.8rem]"></i>
    <InputText type="text" v-model="searchValue" placeholder="Search Messenger.." fluid
      class="!border-none !outline-none !shadow-none !bg-[#f1f1f1] !text-sm !text-[#6b7280] placeholder:!text-[#6b7280] !pl-8 !py-2.5" />
  </div>
</template>
