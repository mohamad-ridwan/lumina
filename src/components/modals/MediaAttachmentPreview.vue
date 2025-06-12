<!-- components/MediaAttachmentPreview.vue -->
<script setup>
import { computed, nextTick, ref, toRaw, watch } from 'vue'
import { Dialog, Button, Textarea } from 'primevue'
import { useToast } from "primevue/usetoast";
import { useChatRoomStore } from '@/stores/chat-room'
import { storeToRefs } from 'pinia'
import { Form } from '@primevue/forms';
import { firebaseUtils } from '@/services/firebase/firebaseUtils';
import { socket } from '@/services/socket/socket';
import { generateRandomId } from '@/helpers/generateRandomId';
import { usersStore } from '@/stores/users';
import { general } from '@/helpers/general';
import dayjs from 'dayjs'
import 'dayjs/locale/id'
import isToday from 'dayjs/plugin/isToday'
import isYesterday from 'dayjs/plugin/isYesterday'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import weekday from 'dayjs/plugin/weekday'
import { fetchMessagesPagination, uploadVideoMessage } from '@/services/api/chat-room';
import { triggerRef } from 'vue';

dayjs.extend(isToday)
dayjs.extend(isYesterday)
dayjs.extend(weekOfYear)
dayjs.extend(weekday)

const { uploadFileToFirebase } = firebaseUtils
const { formatDate, compressedFile, useThumbnailGenerator } = general

const toast = useToast();

// profile store
const userStore = usersStore()
const { profile } = storeToRefs(userStore)
// chat-room store
const chatRoomStore = useChatRoomStore()
const { handleResetAttachment, resetReplyMessageData, triggerSendMessage } = chatRoomStore
const { attachments, formMessage, replyMessageData, chatRoom, chatRoomMessages, proccessSubmitAttachmentData, isStartIndex, scroller } = storeToRefs(chatRoomStore)

const { videoThumbnailUrl, loading: loadingVideoThumbnail, error, generateThumbnail } = useThumbnailGenerator()
const isVisible = ref(false)
const formInput = ref({
  caption: ''
})

const memoizedChatRoomId = computed(() => chatRoom.value.chatRoomId);
const memoizedChatId = computed(() => chatRoom.value.chatId);
const memoizedAttachments = computed(() => {
  if (!attachments.value) return null
  if (attachments.value?.type) {
    return {
      previewUrl: URL.createObjectURL(attachments.value.file),
      file: attachments.value.file,
      type: attachments.value.type
    }
  }
  return null
})
const formattedText = computed(() => {
  return formInput.value.caption.replace(/\n/g, '<br>');
});
const isNeedHeaderDate = computed(() => {
  if (chatRoomMessages.value.length === 0) {
    return true
  }
  const headerCurrently = chatRoomMessages.value.find(message => {
    if (message?.isHeader) {
      const itemDate = dayjs(Number(message?.latestMessageTimestamp)).startOf('day')
      return formatDate(itemDate) === 'Today'
    }
    return false
  })
  return headerCurrently ? false : true
})

watch(memoizedAttachments, (data) => {
  if (data?.file) {
    isVisible.value = true
    if (data.type === 'video') {
      generateThumbnail(data.previewUrl)
    }
  } else {
    isVisible.value = false
  }
})

watch(error, (error) => {
  if (error) {
    toast.add({ severity: 'error', summary: 'An error occurred. Please try again.', life: 3000 });
    isVisible.value = false
    handleResetAttachment()
  }
})

const scrollToBottom = async () => {
  if (!isStartIndex.value) {
    const messages = await fetchMessagesPagination({
      chatId: memoizedChatId.value,
      chatRoomId: memoizedChatRoomId.value,
      isFirstMessage: true,
      profileId: profile.value?.data?.id,
    })
    if (messages?.messages) {
      chatRoomMessages.value = messages.messages
      await nextTick()
      await nextTick()
      triggerRef(chatRoomMessages)
      scroller.value.$refs.scroller.$forceUpdate(true)
      scroller.value.scrollToItem(0)
    }
  }
}

const onFormSubmit = async () => {
  if (!memoizedAttachments.value || proccessSubmitAttachmentData.value || loadingVideoThumbnail.value) return
  let filePath = ''
  if (memoizedAttachments.value.type === 'image') {
    filePath = 'images'
  } else if (memoizedAttachments.value.type === 'video') {
    filePath = 'videos'
  } else if (memoizedAttachments.value.type === 'file') {
    filePath = 'files'
  }
  if (!filePath.trim()) return

  proccessSubmitAttachmentData.value = {
    chatRoomId: memoizedChatRoomId.value,
    chatId: memoizedChatId.value,
    latestMessage: {
      messageId: generateRandomId(15),
      senderUserId: profile.value.data.id,
      messageType: memoizedAttachments.value.type,
      textMessage: '',
      latestMessageTimestamp: Date.now(),
      status: "UNREAD",
      document: {
        type: memoizedAttachments.value.type,
        url: null,
        caption: formattedText.value
      }
    },
    eventType: 'send-message',
    isNeedHeaderDate: isNeedHeaderDate.value,
    recipientProfileId: chatRoom.value?.userIds?.find(id => id !== profile.value?.data?.id),
  }

  if (toRaw(replyMessageData.value)) {
    proccessSubmitAttachmentData.value.latestMessage.replyView = toRaw(replyMessageData.value)
  }

  if (memoizedAttachments.value.type === 'video') {
    proccessSubmitAttachmentData.value.latestMessage.document.progress = 0
    proccessSubmitAttachmentData.value.latestMessage.document.isProgressDone = false
    proccessSubmitAttachmentData.value.latestMessage.document.isCancelled = false
    proccessSubmitAttachmentData.value.latestMessage.document.thumbnail = videoThumbnailUrl.value
    const formData = new FormData();
    formData.append('videoFile', memoizedAttachments.value.file);
    formData.append('message', JSON.stringify(proccessSubmitAttachmentData.value))
    uploadVideoMessage(formData)
    socket.emit('sendMessage', {
      ...toRaw(proccessSubmitAttachmentData.value)
    })
    proccessSubmitAttachmentData.value = null
    await scrollToBottom()
  } else if (memoizedAttachments.value.type === 'image') {
    const fileCompressed = await compressedFile(memoizedAttachments.value.file, memoizedAttachments.value.type)

    uploadFileToFirebase(fileCompressed?.type ? fileCompressed : memoizedAttachments.value.file, `lumina/${filePath}`)
      .then(async (url) => {
        proccessSubmitAttachmentData.value.latestMessage.document.url = url
        socket.emit('sendMessage', {
          ...toRaw(proccessSubmitAttachmentData.value)
        })
        proccessSubmitAttachmentData.value = null

        await scrollToBottom()
      })
  }
  formInput.value.caption = ''
  resetReplyMessageData()
  triggerSendMessage()
  handleResetAttachment()
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
  <Dialog v-model:visible="isVisible" modal header="Media View"
    :style="{ width: '100%', maxWidth: '300px', minWidth: '300px' }" :dismissableMask="true" class="!bg-[#f9fafb]"
    @hide="handleResetAttachment">
    <div class="flex flex-col items-center gap-4 pb-1">
      <!-- Image preview -->
      <img v-if="memoizedAttachments.type === 'image' && memoizedAttachments.previewUrl"
        :src="memoizedAttachments.previewUrl" alt="Preview" class="rounded max-h-64 max-w-full object-cover" />

      <!-- Video preview -->
      <video v-if="memoizedAttachments.type === 'video' && memoizedAttachments.previewUrl"
        class="rounded max-h-64 max-w-full object-cover" preload="auto" :src="memoizedAttachments.previewUrl"
        controls></video>

      <!-- Action buttons -->
      <div class="flex items-center border-t border-t-[#f1f1f1] pr-2 w-full">
        <Form :initialValues="formInput" @submit="onFormSubmit" class="flex items-end w-full gap-2">
          <Textarea v-model="formInput.caption" rows="1" cols="20"
            class="!text-[13px] flex-1 rounded-l-md px-2 pt-2 pb-4 !bg-transparent min-h-[38px] max-h-[150px] w-full !overflow-y-auto !border-none !shadow-none"
            placeholder="Add a caption..." name="caption" :autoResize="true" @keydown="handleTextareaKeydown" />
          <Button :disabled="loadingVideoThumbnail" icon="pi pi-send" aria-label="Send Message"
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
