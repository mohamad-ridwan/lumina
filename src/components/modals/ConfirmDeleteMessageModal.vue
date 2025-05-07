<script setup>
import { ref, watch, computed } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import { useChatRoomStore } from '@/stores/chat-room'
import { storeToRefs } from 'pinia'
import { socket } from '@/services/socket/socket'

// chat-room store
const chatRoomStore = useChatRoomStore()
const { handleResetConfirmDeleteMessage } = chatRoomStore
const { chatRoom, confirmDeleteMessage } = storeToRefs(chatRoomStore)

const isVisible = ref(false)

const isMe = computed(() => {
  return confirmDeleteMessage.value?.senderUserId === confirmDeleteMessage.value?.profileId
})
const myDeletedMessage = computed(() => {
  if (!confirmDeleteMessage.value?.isDeleted) {
    return null
  }
  return confirmDeleteMessage.value?.isDeleted?.find(data => data?.senderUserId === confirmDeleteMessage.value?.profileId)
})

const submitDeleteMessage = (deletionType) => {
  const req = {
    chatRoomId: chatRoom.value?.chatRoomId,
    chatId: chatRoom.value?.chatId,
    messageId: confirmDeleteMessage.value?.messageId,
    deletionType,
    senderUserId: confirmDeleteMessage.value?.profileId,
    eventType: 'delete-message'
  }

  socket.emit('sendMessage', req)
}

// Function close modal
function close() {
  isVisible.value = false
  handleResetConfirmDeleteMessage()
}

// Actions
function handleDeleteForEveryone() {
  submitDeleteMessage('everyone')
  close()
}

function handleDeleteForMe() {
  submitDeleteMessage(myDeletedMessage.value ? 'permanent' : 'me')
  close()
}

function handleCancel() {
  close()
}

watch(confirmDeleteMessage, (data) => {
  if (data?.chatRoomId) {
    isVisible.value = true
  } else {
    isVisible.value = false
  }
})
</script>

<template>
  <Dialog v-model:visible="isVisible" modal :header="'Delete Message'" :style="{ width: '350px' }" :closable="false">
    <div class="flex justify-center flex-col gap-2 pb-4 px-4">
      <Button v-if="isMe && !myDeletedMessage" class="!text-sm" label="Delete for everyone" severity="danger" outlined
        @click="handleDeleteForEveryone" />
      <Button class="!text-sm" label="Delete for me" :severity="(!isMe || myDeletedMessage) ? 'danger' : 'warning'"
        outlined @click="handleDeleteForMe" />
      <Button class="!text-sm" label="Cancel" severity="secondary" @click="handleCancel" />
    </div>
  </Dialog>
</template>

<style>
/* Optional styling tambahan kalau perlu */
.p-dialog-header .p-dialog-title {
  font-size: 16px !important;
  text-align: center !important;
  width: 100%;
}
</style>
