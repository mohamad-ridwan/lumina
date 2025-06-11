<script setup>
import { general } from '@/helpers/general'
import { socket } from '@/services/socket/socket'
import { useChatRoomStore } from '@/stores/chat-room'
import { storeToRefs } from 'pinia'
import { Button, Menu } from 'primevue'
import { computed, ref, watch } from 'vue'
import EmojiPicker from 'vue3-emoji-picker'
import 'vue3-emoji-picker/css'

const { wrapperClass, messageId, profileId, reactionCurrently, messageDeleted, document } = defineProps(['wrapperClass', 'messageId', 'profileId', 'reactionCurrently', 'messageDeleted', 'document'])

const { deviceDetector, computeSafePosition } = general

// store
const chatRoomStore = useChatRoomStore()
const { handleResetActiveSelectReactions, handleSetActiveSelectReactions, resetActiveMessageMenu } = chatRoomStore
const { activeSelectReactions, chatRoom, typeDevice, resetKeyModalReactions } = storeToRefs(chatRoomStore)

const emojiButtonRef = ref(null)
const emojiMenuRef = ref(null)
const moreEmojiPanelRef = ref(null)
const currentPositionMobileBtnMenu = ref({ top: '', left: '' })

const emojis = ref([
  { emoji: '👍', type: 'emoji' },
  { emoji: '❤️', type: 'emoji' },
  { emoji: '😂', type: 'emoji' },
  { emoji: '😮', type: 'emoji' },
  { type: 'add-more-reaction' },
])

const messageComputed = computed(() => {
  const mobilePosition = `top: ${computeSafePosition(currentPositionMobileBtnMenu.value.left, currentPositionMobileBtnMenu.value.top, undefined, currentPositionMobileBtnMenu.value?.type === 'add-more-reaction' ? 350 : 150).top}px !important; inset-inline-start: ${computeSafePosition(currentPositionMobileBtnMenu.value.left, currentPositionMobileBtnMenu.value.top, currentPositionMobileBtnMenu.value?.type === 'add-more-reaction' ? 300 : 230).left}px !important;`

  const isActiveMenu = activeSelectReactions.value?.messageId === messageId

  const isActiveMoreEmoji = activeSelectReactions.value?.type === 'default-reaction' ? undefined : activeSelectReactions.value?.messageId === messageId

  const memoizedChatRoomId = chatRoom.value?.chatRoomId
  const memoizedChatId = chatRoom.value?.chatId
  const isDesktop = typeDevice.value === 'desktop'

  const activeEmoji = () => {
    if (document?.isCancelled !== undefined && document.isCancelled) {
      return false
    }
    if (messageDeleted) {
      return true
    }
  }

  return {
    isActiveMenu,
    isActiveMoreEmoji,
    memoizedChatRoomId,
    memoizedChatId,
    isDesktop,
    mobilePosition,
    activeEmoji: activeEmoji()
  }
})

const submitReactionMessage = (emoji, code) => {
  const req = {
    chatRoomId: messageComputed.value.memoizedChatRoomId,
    chatId: messageComputed.value.memoizedChatId,
    messageId,
    reaction: {
      emoji,
      senderUserId: profileId,
      code,
      latestMessageTimestamp: `${Date.now()}`
    },
    eventType: "reaction-message"
  }

  socket.emit('sendMessage', req)
}

const toggleEmojiMenu = async (event) => {
  if (deviceDetector() === 'mobile') {
    emojiMenuRef.value.toggle(event)
    event.stopPropagation();
    return
  }

  // desktop handler
  const customData = event?.customData
  if (customData) {
    moreEmojiPanelRef.value.toggle(event)
    event.stopPropagation();
    return
  }
  if (messageComputed.value.isActiveMoreEmoji) {
    moreEmojiPanelRef.value.hide()
  }
  emojiMenuRef.value.toggle(event)
  handleSetActiveSelectReactions('default-reaction', messageId, profileId)
}

const onEmojiSelected = (emoji) => {
  if (emoji.type === 'add-more-reaction') {
    handleSetActiveSelectReactions('add-more-reaction', messageId, profileId)
    return
  }
  submitReactionMessage(emoji.emoji, '')
  emojiMenuRef.value.hide()
}

const toggleMoreEmojiPanel = (event) => {
  if (deviceDetector() === 'mobile') {
    currentPositionMobileBtnMenu.value = {
      top: Math.floor(event.y) - 50,
      left: event.x,
      type: 'add-more-reaction',
    }
    activeSelectReactions.value = {
      messageId: messageId,
      profileId: profileId,
      type: 'add-more-reaction',
    }
    moreEmojiPanelRef.value.toggle(event)
    resetActiveMessageMenu()
    return
  }

  // desktop handler
  const buttonEl = emojiButtonRef.value?.$el

  if (!buttonEl || !document.body.contains(buttonEl)) {
    console.warn('Button DOM belum siap / tidak ada di document')
    return
  }

  handleSetActiveSelectReactions('add-more-reaction', messageId, profileId)

  // toggle menu dengan DOM element
  emojiMenuRef.value.toggle(buttonEl)

  const syntheticClickEvent = new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    view: window
  })
  syntheticClickEvent.customData = {
    showMoreEmoji: true
  }
  emojiButtonRef.value.$el.dispatchEvent(syntheticClickEvent)
}

const onMoreSelectEmoji = (emoji) => {
  submitReactionMessage(emoji.i, emoji.u)
  moreEmojiPanelRef.value.hide()
}

const onShow = () => {
  setTimeout(() => {
    handleSetActiveSelectReactions('default-reaction', messageId, profileId)
  }, 0);
}

const onHide = () => {
  setTimeout(() => {
    handleResetActiveSelectReactions()
  }, 0);
}

const onShowMoreEmoji = () => {
  setTimeout(() => {
    handleSetActiveSelectReactions('add-more-reaction', messageId, profileId)
  }, 0);
}

const onTouchStart = async () => {
  if (messageComputed.value.isActiveMenu) {
    handleResetActiveSelectReactions()
    return
  }
  handleSetActiveSelectReactions('default-reaction', messageId, profileId)
}

watch(activeSelectReactions, (reactions) => {
  if (reactions) {
    resetKeyModalReactions.value = false
  }
  if (deviceDetector() === 'mobile' && reactions?.type === 'default-reaction' && reactions?.x !== undefined && reactions?.messageId === messageId) {
    const syntheticClickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window
    })
    if (emojiButtonRef.value) {
      const top = Math.floor(reactions.y)
      const left = Math.floor(reactions.x)
      currentPositionMobileBtnMenu.value = {
        top: top,
        left: left
      }
      emojiButtonRef.value.$el.dispatchEvent(syntheticClickEvent)
    }
  }
})

watch(typeDevice, (newDevice, oldDevice) => {
  if (oldDevice && newDevice !== oldDevice) {
    resetActiveMessageMenu()
    handleResetActiveSelectReactions()
    if (moreEmojiPanelRef.value) {
      moreEmojiPanelRef.value.hide()
    }
    if (emojiMenuRef.value) {
      emojiMenuRef.value.hide()
      currentPositionMobileBtnMenu.value = {
        top: '',
        left: ''
      }
    }
  }
})

watch(resetKeyModalReactions, (reset) => {
  if (reset) {
    if (emojiMenuRef.value) {
      emojiMenuRef.value.hide()
    }
    if (moreEmojiPanelRef.value) {
      moreEmojiPanelRef.value.hide()
    }
  }
})
</script>

<template>
  <div :class="`group/emoji flex w-full items-center relative gap-1.5 ${wrapperClass}`" @click="onTouchStart">
    <!-- Tombol emoji -->
    <Button v-if="messageComputed.activeEmoji" icon="pi pi-face-smile" text rounded size="small"
      :class="`${!messageComputed.isDesktop ? '!hidden' : 'flex'} !w-7 !h-7 items-center justify-center absolute ${messageComputed.isActiveMenu ? 'opacity-100' : 'opacity-0'} group-hover/emoji:opacity-100 !bg-[#A1A1A1] shadow border rotate-180 !text-white`"
      @click.stop="toggleEmojiMenu" ref="emojiButtonRef" />

    <!-- Menu as emoji picker -->
    <Menu @show="onShow" @hide="onHide" ref="emojiMenuRef" :popup="true"
      :class="`!min-w-fit !h-fit !pb-0 ${messageComputed.isActiveMoreEmoji ? '!rounded-lg' : '!rounded-full'}`"
      :style="!messageComputed.isDesktop ? messageComputed.mobilePosition : undefined">
      <template #start>
        <div class="grid grid-cols-5 gap-1 !py-1 px-2 !h-fit">
          <button v-for="emoji in emojis" :key="emoji"
            class="flex items-center justify-center w-9 h-9 rounded-full hover:scale-110 transition-transform"
            :class="emoji?.emoji && `${reactionCurrently?.emoji}` === `${emoji.emoji}` ? '!bg-black/10' : ''"
            @click="onEmojiSelected(emoji)">
            <template v-if="emoji.type === 'emoji'">
              <span class="text-[22px]">{{ emoji.emoji }}</span>
            </template>

            <template v-else-if="emoji.type === 'add-more-reaction'">
              <div
                class="w-7 h-7 flex items-center justify-center rounded-full bg-gray-300 hover:bg-gray-400 transition-colors"
                @click.stop="toggleMoreEmojiPanel">
                <i class="pi pi-plus text-gray-700 text-sm"></i>
              </div>
            </template>
          </button>
        </div>
      </template>
    </Menu>

    <!-- OverlayPanel for More Emoji -->
    <Menu ref="moreEmojiPanelRef" :style="!messageComputed.isDesktop ? messageComputed.mobilePosition : undefined"
      :popup="true" @show="onShowMoreEmoji" @hide="onHide">
      <template #start>
        <EmojiPicker :native="true" @select="onMoreSelectEmoji" />
      </template>
    </Menu>

    <slot />
  </div>
</template>


<style scoped>
/* Optional: agar tombol emoji lebih smooth */
button {
  background: transparent;
  border: none;
  cursor: pointer;
}
</style>
