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
import { computed, onMounted, ref, toRefs, watch } from 'vue'
import { general } from '@/helpers/general'
import { constant } from '@/utils/constant'

dayjs.extend(localizedFormat)

// props
const props = defineProps(['textMessage', 'latestMessageTimestamp', 'status', 'messageId', 'messageType', 'senderUserId', 'replyView', 'profileId', 'reactions', 'isDeleted', 'document'])

// Semua prop ini sekarang adalah Ref karena toRefs
const {
  textMessage,
  latestMessageTimestamp,
  status,
  messageId,
  messageType,
  senderUserId,
  replyView,
  profileId,
  reactions,
  isDeleted,
  document
} = toRefs(props);

const { deviceDetector } = general
const { longPressThreshold } = constant

// store
const chatRoomStore = useChatRoomStore()
const { handleReadMessage, handleScrollToGoMessage, handleResetActiveSelectReactions, resetActiveMessageMenu } = chatRoomStore
const { activeMessageMenu, chatRoom, goingScrollToMessageId, activeSelectReactions, typeDevice, resetKeyModalReactions } = storeToRefs(chatRoomStore)

// state
const markMessageAsReadSocketUpdate = ref(null)
const boxRef = ref(null)
const longPressTimer = ref(null)

const messageComputedProps = computed(() => {
  // Semua prop yang diakses di sini (di dalam <script setup>) harus menggunakan .value
  let messageDeleted = false
  if (isDeleted.value && isDeleted.value.length > 0) {
    messageDeleted = isDeleted.value.find((msg) => msg?.senderUserId === profileId.value)?.deletionType === 'everyone'
  }

  const isDesktop = typeDevice.value === 'desktop'

  const memoizedWrapperImageClass = replyView.value
    ? document.value?.caption
      ? 'rounded-md'
      : reactions.value?.length > 0 ? 'rounded-md' : 'rounded-tr-2xl rounded-tl-2xl rounded-br-md rounded-bl-md'
    : document.value?.caption
      ? 'rounded-br-2xl rounded-bl-2xl rounded-tr-md rounded-tl-md'
      : reactions.value?.length > 0 ? 'rounded-tr-md rounded-tl-md rounded-br-2xl rounded-bl-2xl' : 'rounded-2xl'

  let memoizedTextMessage = ''
  if (!messageDeleted) {
    if (document.value?.caption) {
      memoizedTextMessage = document.value.caption
    } else {
      memoizedTextMessage = textMessage.value
    }
  } else {
    memoizedTextMessage = '<span class="items-center flex gap-1"><i class="pi pi-ban !text-[13px]"></i> You deleted this message.</span>'
  }

  const memoizedBoxWrapperClass = messageDeleted || !document.value ? 'p-2' : ''

  const memoizedReactionInfoClass = !document.value ? 'pl-[2.5rem]' : 'pl-[2.5rem] pr-2 pt-2'

  const memoizedWrapperReplyViewClass = !document.value ? 'pt-1.5' : 'p-2'

  let memoizedClassTextMessage = ''
  if (!messageDeleted) {
    if (document.value?.caption) {
      memoizedClassTextMessage = `px-2 pt-2 ${reactions.value?.length > 0 ? '' : 'pb-2'} text-white text-sm`
    } else {
      memoizedClassTextMessage = 'text-white text-sm'
    }
  } else {
    memoizedClassTextMessage = 'text-[#DDD] italic text-xs'
  }

  let fromMessageUsername = undefined
  if (replyView.value) {
    if (replyView.value.senderUserId === profileId.value) {
      fromMessageUsername = 'You'
    } else {
      fromMessageUsername = chatRoom.value.username
    }
  }

  const reactionCurrently = reactions.value && reactions.value.length > 0
    ? reactions.value.find((react) => react?.senderUserId === profileId.value)
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
    isDesktop,
  }
})

const timeOutActiveReactions = () => {
  setTimeout(() => {
    activeSelectReactions.value = {
      messageId: messageId.value
    }
  }, 0);
}

const toggleBoxMessage = (e) => {
  if (deviceDetector() === 'mobile') {
    return
  }
  if (activeMessageMenu.value?.messageId === messageId.value) {
    activeMessageMenu.value = null
    handleResetActiveSelectReactions()
  } else {
    activeMessageMenu.value = { messageId: messageId.value }
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
    if (messageId.value === data?.messageId) {
      markMessageAsReadSocketUpdate.value = data
    }
  })
})

watch(markMessageAsReadSocketUpdate, (data) => {
  handleReadMessage(data?.messageId)
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

const handleMessageTouchEnd = () => {
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value); // Bersihkan timer long press
    longPressTimer.value = null;
  }
}
</script>

<template>
  <div class="flex flex-col-reverse items-end gap-1 pb-2 message-wrapper" @contextmenu.prevent @click.stop="closeMenu">
    <MessageReaction :message-deleted="!messageComputedProps.messageDeleted" wrapper-class="justify-end"
      :message-id="messageId" :profile-id="profileId" :reaction-currently="messageComputedProps.reactionCurrently">
      <div :key="messageId" ref="boxRef"
        class="group bg-[#2e74e8] rounded-2xl max-w-[65%] md:max-w-[350px] self-end flex flex-col relative"
        :class="messageComputedProps.memoizedBoxWrapperClass" style="box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05)"
        @click.prevent.stop="toggleBoxMessage" @touchstart.stop="handleBoxTouchStart"
        @touchend.stop="handleMessageTouchEnd" @touchcancel.stop="handleMessageTouchEnd">
        <MessageHighlightOverlay :trigger="goingScrollToMessageId === messageId" />

        <div
          :class="`absolute left-0 bottom-[2px] p-1 ${(!messageComputedProps?.isDesktop || activeMessageMenu?.messageId === messageId) ? 'flex' : 'hidden group-hover:flex'} z-[1]`">
          <MessageActionMenu :message-deleted="messageComputedProps.messageDeleted"
            :message="{ textMessage: textMessage, messageId: messageId, messageType: messageType, senderUserId: senderUserId, document: document }"
            :profile-id="profileId" :is-deleted="isDeleted" />
        </div>
        <ReactionInfo v-if="!messageComputedProps.messageDeleted && reactions?.length > 0" :reactions="reactions"
          :profile-id="profileId" :reaction-currently="messageComputedProps.reactionCurrently" :message-id="messageId"
          :wrapper-class="messageComputedProps.memoizedReactionInfoClass" />
        <p class="rotate-180" style="direction: ltr" :class="messageComputedProps.memoizedClassTextMessage"
          v-html="messageComputedProps.memoizedTextMessage"></p>
        <ImageMessage v-if="document?.type && !messageComputedProps.messageDeleted" :info="{
          url: document?.url,
          thumbnail: document?.thumbnail,
          caption: document?.caption,
          username: 'You',
          latestMessageTimestamp: Number(latestMessageTimestamp),
          hours: dayjs(Number(latestMessageTimestamp)).format('HH.mm'),
          messageId: messageId,
          profileId: profileId,
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
