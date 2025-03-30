<script setup>
import Input from '@/components/Input.vue';
import ConfirmPopup from 'primevue/confirmpopup';
import { ref } from 'vue';

const searchValue = ref('')
</script>

<template>
  <ConfirmPopup group="templating">
    <template #message>
      <div class="min-w-[250px] p-2.5 flex flex-col gap-2">
        <h1 class="font-bold text-sm text-center">New Chat</h1>
        <Input v-model="searchValue" class-icon="left-3" icon="pi-search" input-class="!pl-8"
          placeholder="Search username or number" />
      </div>
    </template>
  </ConfirmPopup>
</template>
