<script setup>
import ReplyViewCard from '@/components/ReplyViewCard.vue';
import { useChatRoomStore } from '@/stores/chat-room';
import { usersStore } from '@/stores/users';
import { storeToRefs } from 'pinia';
import { Button } from 'primevue';
import { computed, ref, Transition, watch } from 'vue';

// store
// profile store
const userStore = usersStore()
const { profile } = storeToRefs(userStore)
// chat-room store
const chatRoomStore = useChatRoomStore()
const { resetReplyMessageData, handleScrollToGoMessage } = chatRoomStore
const { replyMessageData, chatRoom } = storeToRefs(chatRoomStore)

// state
const showReplyView = ref(false)

const profileId = computed(() => profile.value?.data?.id ?? null)
const fromMessageUsername = computed(() => {
  if (!replyMessageData.value) return
  if (replyMessageData.value.senderUserId === profileId.value) {
    return 'You'
  } else {
    return chatRoom.value.username
  }
})

const handleResetReply = () => {
  setTimeout(() => {
    resetReplyMessageData()
  }, 500);
}

const handleCloseReply = () => {
  showReplyView.value = false
  clearTimeout(handleResetReply)
  handleResetReply()
}

watch(replyMessageData, (data) => {
  if (data) {
    showReplyView.value = true
  } else {
    showReplyView.value = false
  }
})
</script>

<template>
  <transition name="reply-fade-slide">
    <div v-show="showReplyView" class="flex pb-3 w-full justify-between gap-2 items-end overflow-hidden">
      <ReplyViewCard :username-class="`${fromMessageUsername === 'You' ? 'text-[#2e74e8]' : 'text-black'} text-sm`"
        :wrapper-class="`${fromMessageUsername === 'You' ? 'border-l-[#2e74e8]' : 'border-l-black'} bg-[#F1F1F1] border-l-3 rounded-md py-1`"
        :text-message="replyMessageData?.textMessage" text-message-class="text-[#6b7280]"
        :from-message-username="fromMessageUsername"
        @on-click="handleScrollToGoMessage(replyMessageData?.messageId, profileId)"
        :document="replyMessageData?.document" />
      <div class="flex justify-center h-[35px] w-[35px]">
        <Button icon="pi pi-times" class="!p-1 !bg-[#F1F1F1] !rounded-full !text-gray-500 hover:!bg-gray-200"
          style="height: 25px; width: 25px; font-size: 9px !important; border:none;" @click="handleCloseReply"
          aria-label="Close Reply" />
      </div>
    </div>
  </transition>
</template>


<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.2s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

.reply-fade-slide-enter-active,
.reply-fade-slide-leave-active {
  transition: all 0.3s ease;
  max-height: 100px;
  opacity: 1;
}

.reply-fade-slide-enter-from,
.reply-fade-slide-leave-to {
  max-height: 0;
  opacity: 0;
  padding-bottom: 0;
  margin-bottom: 0;
}
</style>
