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
import { computed, onMounted, ref } from 'vue'

dayjs.extend(localizedFormat)

const { textMessage, latestMessageTimestamp, status, chatId, chatRoomId, messageId, messageType, senderUserId, replyView, profileId, reactions, isDeleted, document } = defineProps(['textMessage', 'latestMessageTimestamp', 'status', 'chatRoomId', 'chatId', 'messageId', 'messageType', 'senderUserId', 'replyView', 'profileId', 'reactions', 'isDeleted', 'document'])

// store
// chat-room store
const chatRoomStore = useChatRoomStore()
const { handleScrollToGoMessage, handleResetActiveSelectReactions } = chatRoomStore
const { activeMessageMenu, chatRoom, goingScrollToMessageId, activeSelectReactions } = storeToRefs(chatRoomStore)

const boxRef = ref(null)

const messageDeleted = computed(() => {
  if (!isDeleted || isDeleted?.length === 0) {
    return null
  }
  const dataCurrently = isDeleted.find(msg => msg?.senderUserId !== profileId)
  if (dataCurrently === undefined) {
    return null
  }
  return dataCurrently.deletionType === 'everyone' || dataCurrently.deletionType === 'permanent'
})

const memoizedTextMessage = computed(() => {
  if (!messageDeleted.value) {
    if (document?.caption) {
      return document.caption
    }
    return textMessage
  }
  return '<span class="items-center flex gap-1"><i class="pi pi-ban !text-[13px]"></i> Message has been deleted.</span>'
})
const memoizedBoxWrapperClass = computed(() => {
  if (messageDeleted.value || !document) return 'p-2'
  return ''
})
const memoizedWrapperImageClass = computed(() => {
  if (replyView) return ''
  return document?.caption ? 'rounded-br-2xl rounded-bl-2xl rounded-tr-md rounded-tl-md' : 'rounded-2xl'
})
const memoizedWrapperReplyViewClass = computed(() => {
  if (!document) return 'pt-1.5'
  return 'p-2'
})
const memoizedReactionInfoClass = computed(() => {
  if (!document) return 'pl-[2.5rem]'
  return 'pl-[2.5rem] pr-2 pt-2'
})
const memoizedClassTextMessage = computed(() => {
  if (!messageDeleted.value) {
    if (document?.caption) {
      return `text-sm ${reactions?.length > 0 ? '' : 'pb-2'} px-2 pt-2`
    }
    return 'text-sm'
  }
  return 'text-[#888] italic text-xs'
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
    <MessageReaction :message-deleted="!messageDeleted" wrapper-class="justify-end flex-row-reverse"
      :message-id="messageId" :profile-id="profileId" :reaction-currently="reactionCurrently">
      <div ref="boxRef" class="group bg-[#f1f1f1] rounded-2xl max-w-[65%] md:max-w-[350px] self-start relative"
        :class="memoizedBoxWrapperClass" style="box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);"
        @click.stop="toggleBoxMessage">
        <!-- ⬇️ Tambahkan di sini overlay -->
        <MessageHighlightOverlay :trigger="goingScrollToMessageId === messageId" />

        <!-- Menu reply -->
        <div
          :class="`absolute left-0 bottom-[2px] p-1 ${activeMessageMenu === messageId ? 'flex' : 'hidden group-hover:flex'} z-[1]`">
          <MessageActionMenu :message-deleted="messageDeleted"
            :message="{ textMessage, messageId, messageType, senderUserId, document }" :profile-id="profileId"
            :is-deleted="isDeleted" />
        </div>
        <!-- Reaction Info -->
        <ReactionInfo v-if="!messageDeleted && reactions?.length > 0" :reactions="reactions" :profile-id="profileId"
          :reaction-currently="reactionCurrently" :message-id="messageId" :wrapper-class="memoizedReactionInfoClass" />
        <p class="text-start rotate-180" style="direction: ltr;" :class="memoizedClassTextMessage"
          v-html="memoizedTextMessage"></p>
        <!-- MEDIA -->
        <ImageMessage v-if="document?.type && !messageDeleted"
          :info="{ url: document.url, thumbnail: document?.thumbnail, caption: document?.caption, username: chatRoom.username, latestMessageTimestamp: Number(latestMessageTimestamp), hours: dayjs(Number(latestMessageTimestamp)).format('HH.mm') }"
          :img-class="memoizedWrapperImageClass" />
        <!-- Reply view -->
        <div v-if="!messageDeleted && replyView" class="flex !text-black" :class="memoizedWrapperReplyViewClass">
          <ReplyViewCard :from-message-username="fromMessageUsername" :text-message="replyView?.textMessage"
            @on-click="handleScrollToGoMessage(replyView?.messageId)" wrapper-style="direction: ltr; rotate: 180deg;"
            wrapper-class="border-l-1 py-0.5" text-message-class="!text-[#6b7280]" username-class="text-xs text-start"
            :document="replyView?.document" />
        </div>
      </div>
    </MessageReaction>
    <span class="text-xs text-[#111827] self-start rotate-180">
      {{ dayjs(Number(latestMessageTimestamp)).format('HH.mm') }}
    </span>
  </div>
</template>
