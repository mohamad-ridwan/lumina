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

const messageComputedProps = computed(() => {
  // messageDeleted
  let messageDeleted = false
  if (isDeleted && isDeleted.length > 0) {
    const dataCurrently = isDeleted.find((msg) => msg?.senderUserId !== profileId)
    if (dataCurrently !== undefined) {
      messageDeleted = dataCurrently.deletionType === 'everyone' || dataCurrently.deletionType === 'permanent'
    }
  }

  // memoizedTextMessage
  let memoizedTextMessage = ''
  if (!messageDeleted) {
    if (document?.caption) {
      memoizedTextMessage = document.caption
    } else {
      memoizedTextMessage = textMessage
    }
  } else {
    memoizedTextMessage = '<span class="items-center flex gap-1"><i class="pi pi-ban !text-[13px]"></i> Message has been deleted.</span>'
  }

  // memoizedBoxWrapperClass
  const memoizedBoxWrapperClass = messageDeleted || !document ? 'p-2' : ''

  // memoizedWrapperImageClass
  const memoizedWrapperImageClass = replyView
    ? ''
    : document?.caption
      ? 'rounded-br-2xl rounded-bl-2xl rounded-tr-md rounded-tl-md'
      : 'rounded-2xl'

  // memoizedWrapperReplyViewClass
  const memoizedWrapperReplyViewClass = !document ? 'pt-1.5' : 'p-2'

  // memoizedReactionInfoClass
  const memoizedReactionInfoClass = !document ? 'pl-[2.5rem]' : 'pl-[2.5rem] pr-2 pt-2'

  // memoizedClassTextMessage
  let memoizedClassTextMessage = ''
  if (!messageDeleted) {
    if (document?.caption) {
      memoizedClassTextMessage = `text-sm ${reactions?.length > 0 ? '' : 'pb-2'} px-2 pt-2`
    } else {
      memoizedClassTextMessage = 'text-sm'
    }
  } else {
    memoizedClassTextMessage = 'text-[#888] italic text-xs'
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
    memoizedTextMessage,
    memoizedBoxWrapperClass,
    memoizedWrapperImageClass,
    memoizedWrapperReplyViewClass,
    memoizedReactionInfoClass,
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
    <MessageReaction :message-deleted="!messageComputedProps.messageDeleted"
      wrapper-class="justify-end flex-row-reverse" :message-id="messageId" :profile-id="profileId"
      :reaction-currently="messageComputedProps.reactionCurrently">
      <div ref="boxRef" class="group bg-[#f1f1f1] rounded-2xl max-w-[65%] md:max-w-[350px] self-start relative"
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
        <p class="text-start rotate-180" style="direction: ltr" :class="messageComputedProps.memoizedClassTextMessage"
          v-html="messageComputedProps.memoizedTextMessage"></p>
        <ImageMessage v-if="document?.type && !messageComputedProps.messageDeleted" :info="{
          url: document.url,
          thumbnail: document?.thumbnail,
          caption: document?.caption,
          username: chatRoom.username,
          latestMessageTimestamp: Number(latestMessageTimestamp),
          hours: dayjs(Number(latestMessageTimestamp)).format('HH.mm'),
          messageId,
          profileId,
        }" :img-class="messageComputedProps.memoizedWrapperImageClass" />
        <div v-if="!messageComputedProps.messageDeleted && replyView" class="flex !text-black"
          :class="messageComputedProps.memoizedWrapperReplyViewClass">
          <ReplyViewCard :from-message-username="messageComputedProps.fromMessageUsername"
            :text-message="replyView?.textMessage" @on-click="handleScrollToGoMessage(replyView?.messageId, profileId)"
            wrapper-style="direction: ltr; rotate: 180deg;" wrapper-class="border-l-1 py-0.5"
            text-message-class="!text-[#6b7280]" username-class="text-xs text-start" :document="replyView?.document" />
        </div>
      </div>
    </MessageReaction>
    <span class="text-xs text-[#111827] self-start rotate-180">
      {{ dayjs(Number(latestMessageTimestamp)).format('HH.mm') }}
    </span>
  </div>
</template>
