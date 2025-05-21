<script setup>
import { usersStore } from '@/stores/users';
import { Button } from 'primevue'

// users store
const userStore = usersStore()
const { setActiveProfile } = userStore
</script>

<template>
  <div class="p-3 flex items-center gap-3">
    <Button icon="pi pi-angle-left" type="button" aria-label="Back" rounded icon-class="text-black" severity="secondary"
      size="small" @click="() => setActiveProfile(false)" />
    <h1 class="font-bold text-lg">Profile</h1>
  </div>
</template>
