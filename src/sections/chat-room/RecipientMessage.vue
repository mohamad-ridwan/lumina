<script setup>
import MessageReaction from '@/components/emoji/MessageReaction.vue'
import ReactionInfo from '@/components/emoji/ReactionInfo.vue'
import ImageMessage from '@/components/media/ImageMessage.vue'
import VideoMessage from '@/components/media/VideoMessage.vue'
import MessageActionMenu from '@/components/menu/MessageActionMenu.vue'
import MessageHighlightOverlay from '@/components/overlay/MessageHighlightOverlay.vue'
import ReplyViewCard from '@/components/ReplyViewCard.vue'
import { general } from '@/helpers/general'
import { socket } from '@/services/socket/socket'
import { useChatRoomStore } from '@/stores/chat-room'
import { constant } from '@/utils/constant'
import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref, toRefs } from 'vue'

dayjs.extend(localizedFormat)

const { deviceDetector } = general
const { longPressThreshold } = constant

// Ambil objek props utuh terlebih dahulu
const props = defineProps([
  'textMessage',
  'latestMessageTimestamp',
  'status',
  'chatRoomId',
  'chatId',
  'messageId',
  'messageType',
  'senderUserId',
  'replyView',
  'profileId',
  'reactions',
  'isDeleted',
  'document'
])

// Kemudian, gunakan toRefs untuk mendestrukturisasi dan mempertahankan reaktivitas
const {
  textMessage,
  latestMessageTimestamp,
  status,
  chatRoomId,
  chatId,
  messageId,
  messageType,
  senderUserId,
  replyView,
  profileId,
  reactions,
  isDeleted,
  document
} = toRefs(props); // Semua prop ini sekarang adalah Ref

// store
const chatRoomStore = useChatRoomStore()
const { handleScrollToGoMessage, handleResetActiveSelectReactions, resetActiveMessageMenu } = chatRoomStore
const { activeMessageMenu, chatRoom, goingScrollToMessageId, activeSelectReactions, typeDevice, resetKeyModalReactions } = storeToRefs(chatRoomStore)

const boxRef = ref(null)
const longPressTimer = ref(null);

const messageComputedProps = computed(() => {
  // Semua prop yang diakses di sini (di dalam <script setup>) harus menggunakan .value
  let messageDeleted = false
  if (isDeleted.value && isDeleted.value.length > 0) {
    const dataCurrently = isDeleted.value.find((msg) => msg?.senderUserId !== profileId.value)
    if (dataCurrently !== undefined) {
      messageDeleted = dataCurrently.deletionType === 'everyone' || dataCurrently.deletionType === 'permanent'
    }
  }

  // memoizedTextMessage
  let memoizedTextMessage = ''
  if (!messageDeleted) {
    if (document.value?.caption) {
      memoizedTextMessage = document.value.caption
    } else {
      memoizedTextMessage = textMessage.value
    }
  } else {
    memoizedTextMessage = '<span class="items-center flex gap-1"><i class="pi pi-ban !text-[13px]"></i> Message has been deleted.</span>'
  }

  // memoizedBoxWrapperClass
  const memoizedBoxWrapperClass = messageDeleted || !document.value ? 'p-2' : ''

  // memoizedWrapperImageClass
  const memoizedWrapperImageClass = replyView.value
    ? document.value?.caption
      ? 'rounded-md'
      : reactions.value?.length > 0 ? 'rounded-md' : 'rounded-tr-2xl rounded-tl-2xl rounded-br-md rounded-bl-md'
    : document.value?.caption
      ? 'rounded-br-2xl rounded-bl-2xl rounded-tr-md rounded-tl-md'
      : reactions.value?.length > 0 ? 'rounded-tr-md rounded-tl-md rounded-br-2xl rounded-bl-2xl' : 'rounded-2xl'

  // memoizedWrapperReplyViewClass
  const memoizedWrapperReplyViewClass = !document.value ? 'pt-1.5' : 'p-2'

  // memoizedReactionInfoClass
  const memoizedReactionInfoClass = !document.value ? 'pl-[2.5rem]' : 'pl-[2.5rem] pr-2 pt-2'

  // memoizedClassTextMessage
  let memoizedClassTextMessage = ''
  if (!messageDeleted) {
    if (document.value?.caption) {
      memoizedClassTextMessage = `text-sm ${reactions.value?.length > 0 ? '' : 'pb-2'} px-2 pt-2`
    } else {
      memoizedClassTextMessage = 'text-sm'
    }
  } else {
    memoizedClassTextMessage = 'text-[#888] italic text-xs'
  }

  // fromMessageUsername
  let fromMessageUsername = undefined
  if (replyView.value) {
    if (replyView.value.senderUserId === profileId.value) {
      fromMessageUsername = 'You'
    } else {
      fromMessageUsername = chatRoom.value.username
    }
  }

  // reactionCurrently
  const reactionCurrently = reactions.value && reactions.value.length > 0
    ? reactions.value.find((react) => react?.senderUserId === profileId.value)
    : undefined

  const isDesktop = typeDevice.value === 'desktop'

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
    isDesktop
  }
})

const timeOutActiveReactions = () => {
  setTimeout(() => {
    activeSelectReactions.value = {
      messageId: messageId.value // .value
    }
  }, 0);
}

const toggleBoxMessage = (e) => {
  if (deviceDetector() === 'mobile') {
    return
  }

  if (activeMessageMenu.value?.messageId === messageId.value) { // .value
    activeMessageMenu.value = null
    handleResetActiveSelectReactions()
  } else {
    activeMessageMenu.value = { messageId: messageId.value } // .value
    clearTimeout(timeOutActiveReactions)
    timeOutActiveReactions()
  }

  e.stopPropagation()
}

const closeMenu = () => {
  activeMessageMenu.value = null
}

onMounted(() => {
  if (status.value === 'UNREAD') { // .value
    socket.emit('markMessageAsRead', {
      chatRoomId: chatRoomId.value, // .value
      chatId: chatId.value, // .value
      messageId: messageId.value, // .value
      status: 'READ'
    })
  }
})

function onLongPressCallbackHook(event) {
  if (deviceDetector() === 'mobile') {
    if (event.touches[0].clientX) {
      activeMessageMenu.value = {
        messageId: messageId.value, // Gunakan messageId.value di script
        x: event.touches[0].clientX, // Ambil koordinat dari touch event
        y: event.touches[0].clientY,
      }
      activeSelectReactions.value = {
        messageId: messageId.value,
        profileId: profileId.value,
        type: 'default-reaction',
        x: event.touches[0].clientX, // Ambil koordinat dari touch event
        y: Math.floor(event.touches[0].clientY) - 50,
      }
    }
  }
}

const handleBoxTouchStart = (event) => {
  resetKeyModalReactions.value = true
  handleResetActiveSelectReactions()
  resetActiveMessageMenu()

  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value);
  }
  longPressTimer.value = setTimeout(() => {
    onLongPressCallbackHook(event)
  }, longPressThreshold);
}

const handleTouchEndLongPress = () => {
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value);
    longPressTimer.value = null;
  }
};
</script>

<template>
  <div class="flex flex-col-reverse gap-1 pb-2 message-wrapper" @contextmenu.prevent @click.stop="closeMenu">
    <MessageReaction :document="document" :message-deleted="!messageComputedProps.messageDeleted"
      wrapper-class="justify-end flex-row-reverse" :message-id="messageId" :profile-id="profileId"
      :reaction-currently="messageComputedProps.reactionCurrently">
      <div :key="messageId" ref="boxRef" @touchstart.stop="handleBoxTouchStart" @touchend.stop="handleTouchEndLongPress"
        @touchcancel.stop="handleTouchEndLongPress"
        class="group bg-[#f1f1f1] rounded-2xl max-w-[65%] md:max-w-[350px] self-start relative"
        :class="messageComputedProps.memoizedBoxWrapperClass" style="box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05)"
        @click.stop="toggleBoxMessage">
        <MessageHighlightOverlay :trigger="goingScrollToMessageId === messageId" />

        <div
          :class="`absolute left-0 bottom-[2px] p-1 ${(!messageComputedProps?.isDesktop || activeMessageMenu?.messageId === messageId) ? 'flex' : 'hidden group-hover:flex'} z-[1]`">
          <MessageActionMenu :message-deleted="messageComputedProps.messageDeleted"
            :message="{ textMessage, messageId, messageType, senderUserId, document }" :profile-id="profileId"
            :is-deleted="isDeleted" />
        </div>
        <ReactionInfo v-if="!messageComputedProps.messageDeleted && reactions?.length > 0" :reactions="reactions"
          :profile-id="profileId" :reaction-currently="messageComputedProps.reactionCurrently" :message-id="messageId"
          :wrapper-class="messageComputedProps.memoizedReactionInfoClass" />
        <p class="text-start rotate-180" style="direction: ltr" :class="messageComputedProps.memoizedClassTextMessage"
          v-html="messageComputedProps.memoizedTextMessage"></p>
        <ImageMessage v-if="document?.type === 'image' && !messageComputedProps.messageDeleted" :info="{
          url: document?.url,
          thumbnail: document?.thumbnail,
          caption: document?.caption,
          username: chatRoom.username,
          latestMessageTimestamp: Number(latestMessageTimestamp),
          hours: dayjs(Number(latestMessageTimestamp)).format('HH.mm'),
          messageId,
          profileId,
        }" :img-class="messageComputedProps.memoizedWrapperImageClass" />
        <VideoMessage v-if="document?.type === 'video' && !messageComputedProps.messageDeleted"
          :video-class="messageComputedProps.memoizedWrapperImageClass" :info="{
            url: document?.url,
            thumbnail: document?.thumbnail,
            caption: document?.caption,
            progress: document?.progress,
            isProgressDone: document?.isProgressDone,
            isCancelled: document?.isCancelled,
            username: 'You',
            latestMessageTimestamp: Number(latestMessageTimestamp),
            hours: dayjs(Number(latestMessageTimestamp)).format('HH.mm'),
            messageId,
            profileId
          }" />
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

<style scoped>
.message-wrapper {
  user-select: none;
  /* Mencegah pemilihan teks */
  -webkit-user-select: none;
  /* Kompatibilitas untuk Safari/iOS */
  -moz-user-select: none;
  /* Kompatibilitas untuk Firefox */
  -ms-user-select: none;
  /* Kompatibilitas untuk IE/Edge */

  touch-action: manipulation;
  /* Memungkinkan scroll normal, tapi melumpuhkan double-tap zoom */
  /* Jika Anda benar-benar ingin menghentikan scroll, gunakan: touch-action: none; */
}

.message-wrapper img {
  -webkit-user-drag: none;
  /* Mencegah drag gambar di WebKit */
}
</style>
