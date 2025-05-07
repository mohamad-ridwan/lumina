<!-- components/MediaAttachmentPreview.vue -->
<script setup>
import { computed, ref, watch } from 'vue'
import { Dialog, Button, Textarea } from 'primevue'
import { useChatRoomStore } from '@/stores/chat-room'
import { storeToRefs } from 'pinia'
import { Form } from '@primevue/forms';

// chat-room store
const chatRoomStore = useChatRoomStore()
const { handleResetAttachment } = chatRoomStore
const { attachments, formMessage } = storeToRefs(chatRoomStore)

const isVisible = ref(false)
const formInput = ref({
  caption: ''
})

const memoizedAttachments = computed(() => {
  if (!attachments.value) return null
  if (attachments.value?.type === 'image') {
    return {
      previewUrl: URL.createObjectURL(attachments.value.file),
      file: attachments.value.file,
      type: attachments.value.type
    }
  }
  return null
})

watch(memoizedAttachments, (data) => {
  if (data?.file) {
    isVisible.value = true
  } else {
    isVisible.value = false
  }
})

// Close modal
const closeModal = () => {
  handleResetAttachment()
}

// Send action
const handleSend = () => {
  handleResetAttachment()
}

const onFormSubmit = async () => {
  console.log(formInput.value, memoizedAttachments.value)
}

const handleTextareaKeydown = (event) => {
  if (event.key === 'Enter' && event.shiftKey) {
    // Shift + Enter: Sisipkan baris baru
    formInput.value.caption += '\n';
    // Mencegah perilaku default Enter (submit jika tidak ada preventDefault di form)
    event.preventDefault();
  } else if (event.key === 'Enter') {
    // Enter saja: Submit pesan
    event.preventDefault(); // Mencegah baris baru
    onFormSubmit();
  }
};

watch([isVisible, formMessage], ([isVisible, formMessage]) => {
  if (formMessage.textMessage) {
    formInput.value.caption = formMessage.textMessage
  }
}, { immediate: true })
</script>

<template>
  <Dialog v-model:visible="isVisible" modal header="1 Media"
    :style="{ width: '100%', maxWidth: '300px', minWidth: '300px' }" :dismissableMask="true" class="!bg-[#f9fafb]">
    <div class="flex flex-col items-center gap-4 pb-1">
      <!-- Image preview -->
      <img v-if="memoizedAttachments.type === 'image' && memoizedAttachments.previewUrl"
        :src="memoizedAttachments.previewUrl" alt="Preview" class="rounded max-h-64 max-w-full object-cover" />

      <!-- Action buttons -->
      <div class="flex items-center border-t border-t-[#f1f1f1] pr-2 w-full">
        <Form :initialValues="formInput" @submit="onFormSubmit" class="flex items-end w-full gap-2">
          <Textarea v-model="formInput.caption" rows="1" cols="20"
            class="!text-[13px] flex-1 rounded-l-md px-2 pt-2 pb-4 !bg-transparent min-h-[38px] max-h-[150px] w-full !overflow-y-auto !border-none !shadow-none"
            placeholder="Add a caption..." name="caption" :autoResize="true" @keydown="handleTextareaKeydown" />
          <Button icon="pi pi-send" aria-label="Send Message"
            class="!rounded-full !bg-[#2e74e8] hover:!bg-[#2e74e8] !h-[32px] !w-[32px] justify-center items-center flex cursor-pointer !text-white !outline-none !border-none !p-0"
            size="large" icon-class="!text-[12px] !mr-0.5 !mt-0.5" type="submit" />
        </Form>
      </div>
    </div>
  </Dialog>
</template>

<style scoped>
/* Optional tweak */
</style>
