<script setup>
import { useChatRoomStore } from '@/stores/chat-room';
import { usersStore } from '@/stores/users';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

// users store
const userStore = usersStore()
const { activeProfile } = storeToRefs(userStore)
// chat room store
const chatRoomStore = useChatRoomStore()
const { chatRoom } = storeToRefs(chatRoomStore)

// logic
const memoizedChatId = computed(() => chatRoom.value?.chatId);
</script>

<template>
  <div v-if="!activeProfile" :class="` ${memoizedChatId ? 'hidden md:flex' : 'flex'} flex-col gap-2 relative h-dvh`">
    <slot></slot>
  </div>
</template>
