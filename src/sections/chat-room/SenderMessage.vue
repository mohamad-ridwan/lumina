<script setup>
import MessageReaction from '@/components/emoji/MessageReaction.vue'
import ReactionInfo from '@/components/emoji/ReactionInfo.vue'
import ImageMessage from '@/components/media/ImageMessage.vue'
import MessageActionMenu from '@/components/menu/MessageActionMenu.vue'
import MessageHighlightOverlay from '@/components/overlay/MessageHighlightOverlay.vue'
import ReplyViewCard from '@/components/ReplyViewCard.vue'
import { socket } from '@/services/socket/socket'
import { useChatRoomStore } from '@/stores/chat-room'
import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref, watch } from 'vue'

dayjs.extend(localizedFormat)

// props
const { textMessage, latestMessageTimestamp, status, messageId, messageType, senderUserId, replyView, profileId, reactions, isDeleted, document } = defineProps(['textMessage', 'latestMessageTimestamp', 'status', 'messageId', 'messageType', 'senderUserId', 'replyView', 'profileId', 'reactions', 'isDeleted', 'document'])

// store
// chat-room store
const chatRoomStore = useChatRoomStore()
const { handleReadMessage, handleScrollToGoMessage, handleResetActiveSelectReactions } = chatRoomStore
const { activeMessageMenu, chatRoom, goingScrollToMessageId, activeSelectReactions } = storeToRefs(chatRoomStore)

// state
const markMessageAsReadSocketUpdate = ref(null)
const boxRef = ref(null)

const messageDeleted = computed(() => {
  if (!isDeleted || isDeleted?.length === 0) {
    return null
  }
  return isDeleted.find(msg => msg?.senderUserId === profileId)?.deletionType === 'everyone'
})

const memoizedTextMessage = computed(() => {
  if (!messageDeleted.value) {
    if (document?.caption) {
      return document.caption
    }
    return textMessage
  }
  return 'You deleted this message.'
})
const memoizedBoxWrapperClass = computed(() => {
  if (!document) return 'p-2'
  return ''
})
const memoizedReactionInfoClass = computed(() => {
  if (!document) return 'pl-[2.5rem]'
  return 'pl-[2.5rem] pr-2 pt-2'
})
const memoizedWrapperReplyViewClass = computed(() => {
  if (!document) return 'pt-1.5'
  return 'p-2'
})
const memoizedClassTextMessage = computed(() => {
  if (!messageDeleted.value) {
    if (document?.caption) {
      return `px-2 pt-2 ${reactions?.length > 0 ? '' : 'pb-2'} text-white text-sm`
    }
    return 'text-white text-sm'
  }
  return 'text-[#DDD] italic text-xs'
})

const fromMessageUsername = computed(() => {
  if (!replyView) return
  if (replyView.senderUserId === profileId) {
    return 'You'
  } else {
    return chatRoom.value.username
  }
})

const reactionCurrently = computed(() => {
  if (!reactions || reactions?.length === 0) {
    return
  }
  return reactions.find(react => react?.senderUserId === profileId)
})

const timeOutActiveReactions = () => {
  setTimeout(() => {
    activeSelectReactions.value = {
      messageId
    }
  }, 0);
}

const toggleBoxMessage = (e) => {
  if (activeMessageMenu.value === messageId) {
    activeMessageMenu.value = null
    handleResetActiveSelectReactions()
  } else {
    activeMessageMenu.value = messageId
    clearTimeout(timeOutActiveReactions)
    timeOutActiveReactions()
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
</script>

<template>
  <div class="flex flex-col-reverse items-end gap-1 pb-2" @click.stop="closeMenu">
    <MessageReaction :message-deleted="!messageDeleted" wrapper-class="justify-end" :message-id="messageId"
      :profile-id="profileId" :reaction-currently="reactionCurrently">
      <div ref="boxRef"
        class="group bg-[#2e74e8] rounded-tr-2xl rounded-br-2xl rounded-bl-2xl max-w-[65%] self-end flex flex-col relative overflow-hidden"
        :class="memoizedBoxWrapperClass" style="box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);"
        @click.stop="toggleBoxMessage">
        <!-- ⬇️ Tambahkan di sini overlay -->
        <MessageHighlightOverlay :trigger="goingScrollToMessageId === messageId" />

        <!-- Button muncul saat hover -->
        <div
          :class="`absolute left-0 bottom-[2px] p-1 ${activeMessageMenu === messageId ? 'flex' : 'hidden group-hover:flex'} z-[1]`">
          <MessageActionMenu :message-deleted="messageDeleted"
            :message="{ textMessage, messageId, messageType, senderUserId }" :profile-id="profileId"
            :is-deleted="isDeleted" />
        </div>
        <!-- Reaction Info -->
        <ReactionInfo v-if="!messageDeleted && reactions?.length > 0" :reactions="reactions" :profile-id="profileId"
          :reaction-currently="reactionCurrently" :message-id="messageId" :wrapper-class="memoizedReactionInfoClass" />
        <p class="rotate-180" style="direction: ltr;" :class="memoizedClassTextMessage" v-html="memoizedTextMessage">
        </p>
        <!-- MEDIA -->
        <ImageMessage v-if="document?.type" :url="document.url" />
        <!-- Reply view -->
        <div v-if="!messageDeleted && replyView" class="flex !text-white" :class="memoizedWrapperReplyViewClass">
          <ReplyViewCard :from-message-username="fromMessageUsername" :text-message="replyView?.textMessage"
            @on-click="handleScrollToGoMessage(replyView?.messageId)" wrapper-style="direction: ltr; rotate: 180deg;"
            wrapper-class="border-l-1 py-0.5" text-message-class="!text-[#EEE]" username-class="text-xs" />
        </div>
      </div>
    </MessageReaction>
    <!-- Status dan waktu -->
    <div class="flex flex-row-reverse items-center gap-1 pl-1" style="direction: ltr;">
      <span class="text-xs text-[#111827] self-end rotate-180">
        {{ dayjs(Number(latestMessageTimestamp)).format('HH.mm') }}
      </span>
      <div v-if="!messageDeleted" class="relative flex items-center">
        <i
          :class="`pi pi-check !text-[11px] ${status === 'UNREAD' ? 'text-gray-400' : 'text-[#2e74e8]'} rotate-180`"></i>
        <i
          :class="`pi pi-check !text-[11px] !absolute right-[3px] ${status === 'UNREAD' ? 'text-gray-400' : 'text-[#2e74e8]'} rotate-180`"></i>
      </div>
    </div>
  </div>
</template>
