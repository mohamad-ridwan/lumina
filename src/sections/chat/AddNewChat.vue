<script setup>
import ChatProfile from '@/components/ChatProfile.vue';
import Input from '@/components/Input.vue';
import { fetchSearchUsers } from '@/services/api/users';
import { usersStore } from '@/stores/users';
import ConfirmPopup from 'primevue/confirmpopup';
import { ref, watch } from 'vue';

// store
// profile store
const userStore = usersStore()
const { profile } = userStore

// props
const emits = defineEmits(['click'])

// state
const loadingSearchUsers = ref(false)
const searchValue = ref('')
const contactUsers = ref([])

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
    contactUsers.value = []
    return
  }
  const usersCurrently = await fetchSearchUsers({
    username: newValue,
    senderId: profile?.data?.id
  })
  if (usersCurrently?.data) {
    contactUsers.value = usersCurrently.data
  }
  loadingSearchUsers.value = false
}, 1000);

const handleClickContact = () => {
  emits('click', false)
}

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
        <div class="flex flex-col gap-2">
          <h1 class="font-bold text-sm text-center">New Chat</h1>
          <Input v-model="searchValue" class-icon="left-3"
            :icon="loadingSearchUsers ? 'pi-spin pi-spinner' : 'pi-search'" input-class="!pl-8"
            placeholder="Search username or number" py-input="!py-1.5" font-size-input="!text-[12px]" />
        </div>

        <ul>
          <li v-for="item in contactUsers" :key="item.id" class="border-b-[0.2px] border-[#f1f1f1]">
            <ChatProfile :username="item.username" font-size-username="text-xs" img-size="h-[30px] w-[30px]"
              height-container="!h-[2.5rem]" @click="handleClickContact()" />
          </li>
          <li v-if="contactUsers.length === 0">
            <span class="text-xs text-[#6b7280]">User not found</span>
          </li>
        </ul>
      </div>
    </template>
  </ConfirmPopup>
</template>
