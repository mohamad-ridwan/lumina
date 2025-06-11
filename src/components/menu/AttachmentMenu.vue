<script setup>
import { computed, ref, watch } from 'vue'
import { useChatRoomStore } from '@/stores/chat-room'
import { storeToRefs } from 'pinia'
import { toRef } from 'vue'
import { useKeyboardVisibility } from '@/composables/useKeyboardVisibility'
import MenuCard from './MenuCard.vue'
import { general } from '@/helpers/general'

// chat-room store
const chatRoomStore = useChatRoomStore()
const { handleSetAttachment } = chatRoomStore
const { proccessSubmitAttachmentData } = storeToRefs(chatRoomStore)

const { getUploadFile } = general

const props = defineProps(['blurInputKey'])

const blurInputKey = toRef(props, 'blurInputKey')

// Ref for menu
const menu = ref(null)

const isUploading = computed(() => !!proccessSubmitAttachmentData.value)

const toggleMenu = (event) => {
  menu.value.menu.toggle(event)
}

const onSelectFile = async (fileType = 'image/*', attachmentType = 'image') => {
  const file = await getUploadFile(fileType)
  if (file) {
    handleSetAttachment({ type: attachmentType, file })
  }
}

// Menu items
const attachmentItems = computed(() => [
  {
    label: 'Photo',
    icon: 'pi pi-image',
    command: onSelectFile,
    disabled: isUploading.value
  },
  {
    label: 'Video',
    icon: 'pi pi-video',
    command: () => onSelectFile('video/*', 'video'),
    disabled: isUploading.value
  },
  // {
  //   label: 'File',
  //   icon: 'pi pi-file',
  //   command: () => console.log('Kirim File'),
  //   disabled: isUploading.value
  // },
])

useKeyboardVisibility(() => {
  // Keyboard ditutup → hide menu
  if (menu.value) {
    menu.value.menu.hide()
  }
})

watch(blurInputKey, () => {
  menu.value = null
})
</script>

<!-- components/AttachmentMenu.vue -->
<template>
  <div class="relative inline-block">
    <MenuCard ref="menu" :items="attachmentItems" :toggleMenu="toggleMenu" btnMenuIcon="pi pi-paperclip"
      btn-size="medium" btn-icon-class="text-sm" />
  </div>
</template>

<style scoped>
/* Optional: tweak spacing or hover later */
</style>
