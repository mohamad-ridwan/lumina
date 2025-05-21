<script setup>
import { usersStore } from '@/stores/users';
import { storeToRefs } from 'pinia';
import ProfileLayout from './ProfileLayout.vue';

// users store
const userStore = usersStore()
const { activeProfile } = storeToRefs(userStore)
</script>

<template>
  <div v-if="activeProfile" class="flex flex-col gap-2 relative h-dvh w-full">
    <div class="flex-1 flex-col flex w-full">
      <ProfileLayout />
    </div>
  </div>
</template>
