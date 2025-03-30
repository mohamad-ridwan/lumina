<script setup>
import Input from '@/components/Input.vue';
import ConfirmPopup from 'primevue/confirmpopup';
import { ref, watch } from 'vue';

const searchValue = ref('')

function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

const debouncedSearch = debounce(async (newValue) => {
  console.log(newValue)
}, 1000);

watch(searchValue, (newValue) => {
  debouncedSearch(newValue)
})
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
