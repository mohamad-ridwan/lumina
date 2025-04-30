<script setup>
import { ref, defineProps } from 'vue'
import { Button, Menu } from 'primevue'
import { useChatRoomStore } from '@/stores/chat-room'
import { storeToRefs } from 'pinia'

// store
// chat-room store
const chatRoomStore = useChatRoomStore()
const { handleActiveMessageMenu, resetActiveMessageMenu, handleSetReplyMessageData } = chatRoomStore
const { activeMessageMenu } = storeToRefs(chatRoomStore)

const props = defineProps({
  message: Object,
})

const menu = ref(null)

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
</script>

<template>
  <div class="!relative flex flex-col">
    <Button type="button" icon="pi pi-angle-up" rounded severity="secondary" aria-label="More" @click="toggle"
      size="small" aria-haspopup="true" :aria-controls="`overlay_menu_${props.message?.messageId}`"
      class="!rounded-md !h-5 !w-4 !text-white !bg-[#7d8494] !border-[0.3px]" />
    <Menu ref="menu" :id="`overlay_menu_${props.message?.messageId}`" :model="items" :popup="true" @show="onShow"
      @hide="onHide" class="!text-xs" />
  </div>
</template>
