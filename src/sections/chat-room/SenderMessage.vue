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

const messageComputedProps = computed(() => {
  // messageDeleted
  let messageDeleted = false
  if (isDeleted && isDeleted.length > 0) {
    messageDeleted = isDeleted.find((msg) => msg?.senderUserId === profileId)?.deletionType === 'everyone'
  }

  // memoizedWrapperImageClass
  const memoizedWrapperImageClass = replyView
    ? ''
    : document?.caption
      ? 'rounded-br-2xl rounded-bl-2xl rounded-tr-md rounded-tl-md'
      : 'rounded-2xl'

  // memoizedTextMessage
  let memoizedTextMessage = ''
  if (!messageDeleted) {
    if (document?.caption) {
      memoizedTextMessage = document.caption
    } else {
      memoizedTextMessage = textMessage
    }
  } else {
    memoizedTextMessage = '<span class="items-center flex gap-1"><i class="pi pi-ban !text-[13px]"></i> You deleted this message.</span>'
  }

  // memoizedBoxWrapperClass
  const memoizedBoxWrapperClass = messageDeleted || !document ? 'p-2' : ''

  // memoizedReactionInfoClass
  const memoizedReactionInfoClass = !document ? 'pl-[2.5rem]' : 'pl-[2.5rem] pr-2 pt-2'

  // memoizedWrapperReplyViewClass
  const memoizedWrapperReplyViewClass = !document ? 'pt-1.5' : 'p-2'

  // memoizedClassTextMessage
  let memoizedClassTextMessage = ''
  if (!messageDeleted) {
    if (document?.caption) {
      memoizedClassTextMessage = `px-2 pt-2 ${reactions?.length > 0 ? '' : 'pb-2'} text-white text-sm`
    } else {
      memoizedClassTextMessage = 'text-white text-sm'
    }
  } else {
    memoizedClassTextMessage = 'text-[#DDD] italic text-xs'
  }

  // fromMessageUsername
  let fromMessageUsername = undefined
  if (replyView) {
    if (replyView.senderUserId === profileId) {
      fromMessageUsername = 'You'
    } else {
      fromMessageUsername = chatRoom.value.username
    }
  }

  // reactionCurrently
  const reactionCurrently = reactions && reactions.length > 0
    ? reactions.find((react) => react?.senderUserId === profileId)
    : undefined

  return {
    messageDeleted,
    memoizedWrapperImageClass,
    memoizedTextMessage,
    memoizedBoxWrapperClass,
    memoizedReactionInfoClass,
    memoizedWrapperReplyViewClass,
    memoizedClassTextMessage,
    fromMessageUsername,
    reactionCurrently,
  }
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
    <MessageReaction :message-deleted="!messageComputedProps.messageDeleted" wrapper-class="justify-end"
      :message-id="messageId" :profile-id="profileId" :reaction-currently="messageComputedProps.reactionCurrently">
      <div ref="boxRef"
        class="group bg-[#2e74e8] rounded-2xl max-w-[65%] md:max-w-[350px] self-end flex flex-col relative"
        :class="messageComputedProps.memoizedBoxWrapperClass" style="box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05)"
        @click.stop="toggleBoxMessage">
        <MessageHighlightOverlay :trigger="goingScrollToMessageId === messageId" />

        <div
          :class="`absolute left-0 bottom-[2px] p-1 ${activeMessageMenu === messageId ? 'flex' : 'hidden group-hover:flex'} z-[1]`">
          <MessageActionMenu :message-deleted="messageComputedProps.messageDeleted"
            :message="{ textMessage, messageId, messageType, senderUserId, document }" :profile-id="profileId"
            :is-deleted="isDeleted" />
        </div>
        <ReactionInfo v-if="!messageComputedProps.messageDeleted && reactions?.length > 0" :reactions="reactions"
          :profile-id="profileId" :reaction-currently="messageComputedProps.reactionCurrently" :message-id="messageId"
          :wrapper-class="messageComputedProps.memoizedReactionInfoClass" />
        <p class="rotate-180" style="direction: ltr" :class="messageComputedProps.memoizedClassTextMessage"
          v-html="messageComputedProps.memoizedTextMessage"></p>
        <ImageMessage v-if="document?.type && !messageComputedProps.messageDeleted" :info="{
          url: document.url,
          thumbnail: document?.thumbnail,
          caption: document?.caption,
          username: 'You', // username di sini tetap 'You' sesuai aslinya
          latestMessageTimestamp: Number(latestMessageTimestamp),
          hours: dayjs(Number(latestMessageTimestamp)).format('HH.mm'),
          messageId,
          profileId,
        }" :img-class="messageComputedProps.memoizedWrapperImageClass" />
        <div v-if="!messageComputedProps.messageDeleted && replyView" class="flex !text-white"
          :class="messageComputedProps.memoizedWrapperReplyViewClass">
          <ReplyViewCard :from-message-username="messageComputedProps.fromMessageUsername"
            :text-message="replyView?.textMessage" @on-click="handleScrollToGoMessage(replyView?.messageId, profileId)"
            wrapper-style="direction: ltr; rotate: 180deg;" wrapper-class="border-l-1 py-0.5"
            text-message-class="!text-[#EEE]" username-class="text-xs" :document="replyView?.document" />
        </div>
      </div>
    </MessageReaction>
    <div class="flex flex-row-reverse items-center gap-1 pl-1" style="direction: ltr;">
      <span class="text-xs text-[#111827] self-end rotate-180">
        {{ dayjs(Number(latestMessageTimestamp)).format('HH.mm') }}
      </span>
      <div v-if="!messageComputedProps.messageDeleted" class="relative flex items-center">
        <i
          :class="`pi pi-check !text-[11px] ${status === 'UNREAD' ? 'text-gray-400' : 'text-[#2e74e8]'} rotate-180`"></i>
        <i
          :class="`pi pi-check !text-[11px] !absolute right-[3px] ${status === 'UNREAD' ? 'text-gray-400' : 'text-[#2e74e8]'} rotate-180`"></i>
      </div>
    </div>
  </div>
</template>
