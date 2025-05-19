<script setup>
import { computed, ref, watch } from 'vue'
import { useChatRoomStore } from '@/stores/chat-room'
import { storeToRefs } from 'pinia'
import { toRef } from 'vue'
import { useKeyboardVisibility } from '@/composables/useKeyboardVisibility'
import MenuCard from './MenuCard.vue'

// chat-room store
const chatRoomStore = useChatRoomStore()
const { handleSetAttachment } = chatRoomStore
const { proccessSubmitAttachmentData } = storeToRefs(chatRoomStore)

const props = defineProps(['blurInputKey'])

const blurInputKey = toRef(props, 'blurInputKey')

// Ref for menu
const menu = ref(null)

const isUploading = computed(() => !!proccessSubmitAttachmentData.value)

const toggleMenu = (event) => {
  menu.value.menu.toggle(event)
}

const onSelectPhoto = async () => {
  // Trigger file picker
  const fileInput = document.createElement('input')
  fileInput.type = 'file'
  fileInput.accept = 'image/*'
  fileInput.onchange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // selectedImage.value = file
      // isPreviewVisible.value = true
      handleSetAttachment({ type: 'image', file })
    }
  }
  fileInput.click()
}

// Menu items
const attachmentItems = computed(() => [
  {
    label: 'Photo',
    icon: 'pi pi-image',
    command: onSelectPhoto,
    disabled: isUploading.value
  },
  // {
  //   label: 'Video',
  //   icon: 'pi pi-video',
  //   command: () => console.log('Kirim Video'),
  //   disabled: isUploading.value
  // },
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
