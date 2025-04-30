<script setup>
import { ref, defineProps, defineEmits } from 'vue'
import { Button, Menu } from 'primevue'
import { useChatRoomStore } from '@/stores/chat-room'
import { storeToRefs } from 'pinia'

// store
// chat-room store
const chatRoomStore = useChatRoomStore()
const { handleActiveMessageMenu, resetActiveMessageMenu } = chatRoomStore
const { activeMessageMenu } = storeToRefs(chatRoomStore)

const props = defineProps({
  message: Object,
})

const emit = defineEmits(['reply'])

const menu = ref(null)

const items = [
  {
    label: 'Reply',
    icon: 'pi pi-reply',
    command: () => {
      emit('reply', props.message)
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
}

const onHide = () => {
  resetActiveMessageMenu()
}
</script>

<template>
  <div class="relative">
    <Button icon="pi pi-angle-up" rounded severity="secondary" aria-label="More" @click="toggle" size="small"
      class="!rounded-md !h-5 !w-4 !text-white !bg-[#7d8494] !border-[0.3px]" />
    <Menu ref="menu" :model="items" popup @hide="onHide" />
  </div>
</template>
