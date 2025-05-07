<script setup>
import { computed, ref } from 'vue'
import { Button, Menu } from 'primevue'
import { useChatRoomStore } from '@/stores/chat-room'
import { storeToRefs } from 'pinia'

// chat-room store
const chatRoomStore = useChatRoomStore()
const { handleSetAttachment } = chatRoomStore
const { proccessSubmitAttachmentData } = storeToRefs(chatRoomStore)

// Ref for menu
const menu = ref(null)

const isUploading = computed(() => !!proccessSubmitAttachmentData.value)

const toggleMenu = (event) => {
  menu.value.toggle(event)
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
  {
    label: 'Video',
    icon: 'pi pi-video',
    command: () => console.log('Kirim Video'),
    disabled: isUploading.value
  },
  {
    label: 'File',
    icon: 'pi pi-file',
    command: () => console.log('Kirim File'),
    disabled: isUploading.value
  },
])
</script>

<!-- components/AttachmentMenu.vue -->
<template>
  <div class="relative inline-block">
    <!-- Button icon (PrimeVue Button with icon) -->
    <Button icon="pi pi-paperclip" class="p-button-rounded p-button-text" @click="toggleMenu" aria-label="Attachment" />

    <!-- Dropdown menu -->
    <Menu ref="menu" :model="attachmentItems" popup />
  </div>
</template>

<style scoped>
/* Optional: tweak spacing or hover later */
</style>
