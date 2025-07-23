<script setup>
import { theme } from '@/assets/theme';
import { useConfirm } from 'primevue/useconfirm'
import Button from 'primevue/button';
import { computed, ref } from 'vue';
import AddNewChat from './AddNewChat.vue';
import { deleteSessionLogin } from '@/storage-management/local-storage/session-login';
import { useRouter } from 'vue-router';
import { usersStore } from '@/stores/users';
import { chatsStore } from '@/stores/chats';
import { useChatRoomStore } from '@/stores/chat-room';
import { socket } from '@/services/socket/socket';
import { storeToRefs } from 'pinia';
import MenuCard from '@/components/menu/MenuCard.vue';
import { ordersStore } from '@/stores/orders';

// props
const { scroller } = defineProps(['scroller'])

const confirm = useConfirm();
const router = useRouter()

// store
// users store
const userStore = usersStore()
const { setProfile, setActiveProfile } = userStore
const { profile } = storeToRefs(userStore)
// orders store
const orderStore = ordersStore()
const { setActiveOrder } = orderStore
const { orders } = storeToRefs(orderStore)
// chat store
const chatStore = chatsStore()
const { setChats, searchMessengerData } = chatStore
// chat room store
const chatRoomStore = useChatRoomStore()
const { setChatRoom, setChatRoomMessages, handleResetConfirmDeleteMessage } = chatRoomStore
const { chatRoom } = storeToRefs(chatRoomStore)

// state
const confirmState = ref(null)
const menu = ref(null)

// logic
const profileId = computed(() => profile.value?.data.id)
const memoizedChatId = computed(() => {
  return chatRoom.value?.chatId
})
const memoizedChatRoomId = computed(() => {
  return chatRoom.value?.chatRoomId
})

const handleLogout = () => {
  // offline first
  socket.emit('userOffline', profileId.value)
  // leave room
  if (memoizedChatId.value) {
    socket.emit('leaveRoom', {
      chatRoomId: memoizedChatRoomId.value,
      chatId: memoizedChatId.value,
      userId: profileId.value
    })
  }
  deleteSessionLogin()
  router.push('/login')
  setProfile(null)
  setChats([])
  setChatRoom({})
  setChatRoomMessages([])
  searchMessengerData.value = []
}

const handleOpenProfile = () => {
  handleResetConfirmDeleteMessage()
  setActiveProfile(true)
  setChatRoom({})
  setChatRoomMessages([])
  if (memoizedChatId.value) {
    socket.emit('leaveRoom', {
      chatRoomId: memoizedChatRoomId.value,
      chatId: memoizedChatId.value,
      userId: profileId.value
    })
  }
}

const chatsMenu = [
  {
    label: 'Profile',
    icon: 'pi pi-image',
    command: handleOpenProfile,
  },
  {
    label: 'Logout',
    icon: 'pi pi-sign-out',
    command: handleLogout,
    iconClass: '!text-red-700',
    labelClass: '!text-red-700',
  },
]

const showTemplate = (event) => {
  if (confirmState.value) {
    confirmState.value = event.currentTarget
  } else {
    confirmState.value = null
    confirm.close()
  }

  confirm.require({
    target: confirmState.value,
    group: 'templating',
    message: 'Please confirm to proceed moving forward.',
    acceptClass: '!hidden',
    rejectClass: '!hidden',
  });
}

const handleScrollToTop = () => {
  if (scroller) {
    scroller.scrollToItem(0)
  }
}

const toggleMenu = (event) => {
  menu.value.menu.toggle(event)
}

const handleOpenOrders = () => {
  setActiveOrder(true)
}
</script>

<template>
  <AddNewChat @click="confirm.close()" />

  <div class="flex flex-col pt-4 px-4 gap-5 w-full bg-white">
    <div class="flex w-full justify-between items-center">
      <button class="!cursor-pointer" name="chats" @click="handleScrollToTop">
        <h1 class="font-bold text-lg">Chats</h1>
      </button>
      <div class="flex items-center gap-4">
        <div v-if="profile?.data?.role === 'admin'" class="relative cursor-pointer" @click="handleOpenOrders">
          <Button icon="pi pi-box" aria-label="Orders" :class="theme.regularBtn" size="small" icon-class="!text-xs" />
          <div v-if="orders.pagination?.totalOrders"
            class="absolute flex justify-center items-center h-5 w-5 bg-red-500 text-white rounded-full top-[-10px] border border-white right-[-8px]">
            <span class="text-xs">{{ orders.pagination?.totalOrders }}</span>
          </div>
        </div>
        <Button icon="pi pi-plus" aria-label="Chat" :class="theme.regularBtn" size="small" icon-class="!text-xs"
          @click="showTemplate($event)" />
        <MenuCard ref="menu" :items="chatsMenu" :toggleMenu="toggleMenu" btnMenuIcon="pi pi-ellipsis-v" />
      </div>
    </div>
    <slot name="search"></slot>
  </div>

</template>
