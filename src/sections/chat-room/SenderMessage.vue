<script setup>
import MessageActionMenu from '@/components/menu/MessageActionMenu.vue'
import MessageHighlightOverlay from '@/components/overlay/MessageHighlightOverlay.vue'
import ReplyViewCard from '@/components/ReplyViewCard.vue'
import { useClickOutside } from '@/composables/useClickOutside'
import { socket } from '@/services/socket/socket'
import { useChatRoomStore } from '@/stores/chat-room'
import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref, watch } from 'vue'

dayjs.extend(localizedFormat)

// props
const { textMessage, latestMessageTimestamp, status, messageId, messageType, senderUserId, replyView, profileId } = defineProps(['textMessage', 'latestMessageTimestamp', 'status', 'messageId', 'messageType', 'senderUserId', 'replyView', 'profileId'])

// store
// chat-room store
const chatRoomStore = useChatRoomStore()
const { handleReadMessage, handleScrollToGoMessage } = chatRoomStore
const { activeMessageMenu, chatRoomUsername, goingScrollToMessageId } = storeToRefs(chatRoomStore)

// state
const markMessageAsReadSocketUpdate = ref(null)
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
  socket.on('markMessageAsRead', (data) => {
    if (messageId === data?.messageId) {
      markMessageAsReadSocketUpdate.value = data
    }
  })
})

watch(markMessageAsReadSocketUpdate, (data) => {
  handleReadMessage(data?.messageId)
})

useClickOutside(boxRef, closeMenu);
</script>

<template>
  <div class="flex flex-col-reverse items-end gap-1 pb-2">
    <div ref="boxRef"
      class="group bg-[#2e74e8] rounded-tr-md rounded-br-md rounded-bl-lg p-2 max-w-xs self-end relative"
      style="box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);" @click="toggleBoxMessage">
      <!-- ⬇️ Tambahkan di sini overlay -->
      <MessageHighlightOverlay :trigger="goingScrollToMessageId === messageId" />

      <!-- Button muncul saat hover -->
      <div
        :class="`absolute left-0 bottom-[-2px] p-1 ${activeMessageMenu === messageId ? 'flex' : 'hidden group-hover:flex'} z-[1]`">
        <MessageActionMenu :message="{ textMessage, messageId, messageType, senderUserId }" />
      </div>
      <p class="text-white text-sm rotate-180" style="direction: ltr;" v-html="textMessage"></p>
      <!-- Reply view -->
      <div v-if="replyView" class="pt-1.5 flex !text-white">
        <ReplyViewCard :from-message-username="fromMessageUsername" :text-message="replyView?.textMessage"
          @on-click="handleScrollToGoMessage(replyView?.messageId)" wrapper-style="direction: ltr; rotate: 180deg;"
          wrapper-class="border-l-1 py-0.5" text-message-class="!text-[#EEE]" username-class="text-xs" />
      </div>
    </div>
    <!-- Status dan waktu -->
    <div class="flex flex-row-reverse items-center gap-1 pl-1" style="direction: ltr;">
      <span class="text-xs text-[#111827] self-end rotate-180">
        {{ dayjs(Number(latestMessageTimestamp)).format('HH.mm') }}
      </span>
      <div class="relative flex items-center">
        <i
          :class="`pi pi-check !text-[11px] ${status === 'UNREAD' ? 'text-gray-400' : 'text-[#2e74e8]'} rotate-180`"></i>
        <i
          :class="`pi pi-check !text-[11px] !absolute right-[3px] ${status === 'UNREAD' ? 'text-gray-400' : 'text-[#2e74e8]'} rotate-180`"></i>
      </div>
    </div>
  </div>
</template>
