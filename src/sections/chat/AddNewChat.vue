<script setup>
import ChatProfile from '@/components/ChatProfile.vue';
import Input from '@/components/Input.vue';
import { fetchSearchUsers } from '@/services/api/users';
import { useChatRoomStore } from '@/stores/chat-room';
import { chatsStore } from '@/stores/chats';
import { usersStore } from '@/stores/users';
import { storeToRefs } from 'pinia';
import ConfirmPopup from 'primevue/confirmpopup';
import { computed, ref, watch } from 'vue';

// store
// profile store
const userStore = usersStore()
const { profile } = storeToRefs(userStore)
// chat store
const chatStore = chatsStore()
const { chats } = storeToRefs(chatStore)
// chat-room store
const chatRoomStore = useChatRoomStore()
const { handleClickUser } = chatRoomStore
const { chatRoom } = storeToRefs(chatRoomStore)

// props
const emits = defineEmits(['click'])

// state
const loadingSearchUsers = ref(false)
const searchValue = ref('')
const contactUsers = ref([])

// logic
const memoizedUserIds = computed(() => {
  return chatRoom.value?.userIds?.slice()
})

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
  if (!newValue.trim()) {
    loadingSearchUsers.value = false
    contactUsers.value = []
    return
  }
  const usersCurrently = await fetchSearchUsers({
    username: newValue,
    senderId: profile.value?.data?.id
  })
  if (usersCurrently?.data) {
    contactUsers.value = usersCurrently.data
  }
  loadingSearchUsers.value = false
}, 1000);

const handleClickContact = async (userId) => {
  const isAlreadyInChatRoom = memoizedUserIds.value?.find(id => id === userId)
  if (isAlreadyInChatRoom) {
    emits('click', false)
    return
  }

  const chatCurrently = chats.value?.slice()?.find(chat => chat.userIds?.slice()?.find(id => id === userId))
  let itemCurrently = {}
  if (chatCurrently) {
    itemCurrently = chatCurrently
  } else {
    itemCurrently = {
      userIds: [userId, profile.value.data.id],
    }
  }
  handleClickUser(profile.value.data.id, itemCurrently, !chatCurrently ?? false)

  // close popup
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
      <div class="min-w-[250px] max-h-[70vh] overflow-hidden p-2.5 flex flex-col gap-2">
        <div class="flex flex-col gap-2">
          <h1 class="font-bold text-sm text-center">New Chat</h1>
          <Input v-model="searchValue" class-icon="left-3"
            :icon="loadingSearchUsers ? 'pi-spin pi-spinner' : 'pi-search'" input-class="!pl-8"
            placeholder="Search username or number" py-input="!py-1.5" font-size-input="!text-[12px]" />
        </div>

        <ul class="overflow-y-auto h-fit">
          <li v-for="item in contactUsers" :key="item.id" class="border-b-[0.2px] border-[#f1f1f1]">
            <ChatProfile :username="item.username" font-size-username="text-xs" img-size="h-[30px] w-[30px]"
              height-container="!h-[2.5rem]" :image="item.image" @click="handleClickContact(item.id)" />
          </li>
          <li v-if="contactUsers.length === 0 && searchValue.trim()">
            <span class="text-xs text-[#6b7280]">User not found</span>
          </li>
        </ul>
      </div>
    </template>
  </ConfirmPopup>
</template>
