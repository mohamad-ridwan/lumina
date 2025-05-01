<script setup>
import { ref, defineProps, onUnmounted, computed, onBeforeMount } from 'vue'
import { Button, Menu } from 'primevue'
import { useChatRoomStore } from '@/stores/chat-room'
import { storeToRefs } from 'pinia'
import { general } from '@/helpers/general'

// store
// chat-room store
const chatRoomStore = useChatRoomStore()
const { handleActiveMessageMenu, resetActiveMessageMenu, handleSetReplyMessageData } = chatRoomStore
const { activeMessageMenu } = storeToRefs(chatRoomStore)

const { deviceDetector } = general

const props = defineProps({
  message: Object,
  profileId: String
})

const menu = ref(null)
const deviceCurrently = ref(null)

const memoizedMenuStyle = computed(() => {
  if (deviceCurrently.value === 'mobile') {
    return `margin-bottom: 40px; direction: ltr; rotate: 180deg; display: block !important; ${props.message.senderUserId === props.profileId ? '' : 'right: 0px;'}`
  }
  return
})

const items = [
  {
    label: 'Reply',
    command: () => {
      handleSetReplyMessageData(props.message)
    }
  }
]

const toggle = (event) => {
  menu.value.toggle(event)
  if (activeMessageMenu.value === props.message.messageId) {
    resetActiveMessageMenu()
  } else {
    handleActiveMessageMenu(props.message.messageId)
  }
  event.stopPropagation()
}

const handleResetMenu = () => {
  setTimeout(() => {
    resetActiveMessageMenu()
  }, 0);
}

const onHide = () => {
  clearTimeout(handleResetMenu)
  handleResetMenu()
}

const onShow = () => {
  handleActiveMessageMenu(props.message.messageId)
}

const checkDevice = () => {
  setInterval(() => {
    deviceCurrently.value = deviceDetector()
  }, 1000);
}

onBeforeMount(() => {
  deviceCurrently.value = deviceDetector()
  checkDevice()
})

onUnmounted(() => {
  clearInterval(checkDevice)
})
</script>

<template>
  <div class="flex flex-col">
    <Button type="button" icon="pi pi-angle-up" rounded severity="secondary" aria-label="More" @click="toggle"
      size="small" aria-haspopup="true" :aria-controls="`overlay_menu_${props.message?.messageId}`"
      class="!rounded-md !h-5 !w-4 !text-white !bg-[#7d8494] !border-[0.3px]" />
    <Menu ref="menu" :id="`overlay_menu_${props.message?.messageId}`" :model="items" :popup="true" @show="onShow"
      @hide="onHide" class="!text-xs absolute z-50 top-6 !min-w-[100px] !flex"
      :appendTo="deviceCurrently === 'desktop' ? 'body' : 'self'" :style="memoizedMenuStyle" />
  </div>
</template>
