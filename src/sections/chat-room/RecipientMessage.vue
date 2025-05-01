<script setup>
import MessageActionMenu from '@/components/menu/MessageActionMenu.vue'
import MessageHighlightOverlay from '@/components/overlay/MessageHighlightOverlay.vue'
import ReplyViewCard from '@/components/ReplyViewCard.vue'
import { socket } from '@/services/socket/socket'
import { useChatRoomStore } from '@/stores/chat-room'
import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref } from 'vue'

dayjs.extend(localizedFormat)

const { textMessage, latestMessageTimestamp, status, chatId, chatRoomId, messageId, messageType, senderUserId, replyView, profileId } = defineProps(['textMessage', 'latestMessageTimestamp', 'status', 'chatRoomId', 'chatId', 'messageId', 'messageType', 'senderUserId', 'replyView', 'profileId'])

// store
// chat-room store
const chatRoomStore = useChatRoomStore()
const { handleScrollToGoMessage } = chatRoomStore
const { activeMessageMenu, chatRoomUsername, goingScrollToMessageId } = storeToRefs(chatRoomStore)

const boxRef = ref(null)

const fromMessageUsername = computed(() => {
  if (!replyView) return
  if (replyView.senderUserId === profileId) {
    return 'You'
  } else {
    return chatRoomUsername.value
  }
})

const toggleBoxMessage = (e) => {
  if (activeMessageMenu.value === messageId) {
    activeMessageMenu.value = null
  } else {
    activeMessageMenu.value = messageId
  }

  e.stopPropagation()
}

const closeMenu = () => {
  activeMessageMenu.value = null
}

onMounted(() => {
  if (status === 'UNREAD') {
    socket.emit('markMessageAsRead', {
      chatRoomId,
      chatId,
      messageId,
      status: 'READ'
    })
  }
})
</script>

<template>
  <div class="flex flex-col-reverse gap-1 pb-2" @click.stop="closeMenu">
    <div ref="boxRef"
      class="group bg-[#f1f1f1] rounded-tl-md rounded-bl-md rounded-br-lg p-2 max-w-[65%] self-start relative"
      style="box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);" @click.stop="toggleBoxMessage">
      <!-- ⬇️ Tambahkan di sini overlay -->
      <MessageHighlightOverlay :trigger="goingScrollToMessageId === messageId" />

      <!-- Menu reply -->
      <div
        :class="`absolute left-0 bottom-[-2px] p-1 ${activeMessageMenu === messageId ? 'flex' : 'hidden group-hover:flex'} z-[1]`">
        <MessageActionMenu :message="{ textMessage, messageId, messageType, senderUserId }" :profile-id="profileId" />
      </div>
      <p class="text-sm text-start rotate-180" style="direction: ltr;" v-html="textMessage"></p>
      <!-- Reply view -->
      <div v-if="replyView" class="pt-1.5 flex !text-black">
        <ReplyViewCard :from-message-username="fromMessageUsername" :text-message="replyView?.textMessage"
          @on-click="handleScrollToGoMessage(replyView?.messageId)" wrapper-style="direction: ltr; rotate: 180deg;"
          wrapper-class="border-l-1 py-0.5" text-message-class="!text-[#6b7280]" username-class="text-xs text-start" />
      </div>
    </div>
    <span class="text-xs text-[#111827] self-start rotate-180">
      {{ dayjs(Number(latestMessageTimestamp)).format('HH.mm') }}
    </span>
  </div>
</template>
