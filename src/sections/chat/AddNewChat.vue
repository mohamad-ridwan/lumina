<script setup>
import Input from '@/components/Input.vue';
import { fetchSearchUsers } from '@/services/api/users';
import { usersStore } from '@/stores/users';
import ConfirmPopup from 'primevue/confirmpopup';
import { ref, watch } from 'vue';

// store
// profile store
const userStore = usersStore()
const { profile } = userStore

// state
const loadingSearchUsers = ref(false)
const searchValue = ref('')

// logic
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
  if (!newValue) {
    loadingSearchUsers.value = false
    return
  }
  const usersCurrently = await fetchSearchUsers({
    username: newValue,
    senderId: profile?.data?.id
  })
  loadingSearchUsers.value = false
}, 1000);

// hooks rendering
watch(searchValue, (newValue) => {
  loadingSearchUsers.value = true
  debouncedSearch(newValue)
})
</script>

<template>
  <ConfirmPopup group="templating">
    <template #message>
      <div class="min-w-[250px] p-2.5 flex flex-col gap-2">
        <h1 class="font-bold text-sm text-center">New Chat</h1>
        <Input v-model="searchValue" class-icon="left-3" :icon="loadingSearchUsers ? 'pi-spin pi-spinner' : 'pi-search'"
          input-class="!pl-8" placeholder="Search username or number" />
      </div>
    </template>
  </ConfirmPopup>
</template>
