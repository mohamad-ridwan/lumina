<script setup>
import { socket } from '@/services/socket/socket'
import { useChatRoomStore } from '@/stores/chat-room'
import { storeToRefs } from 'pinia'
import { Button, Menu } from 'primevue'
import { computed, ref } from 'vue'
import EmojiPicker from 'vue3-emoji-picker'
import 'vue3-emoji-picker/css'

const { wrapperClass, messageId, profileId } = defineProps(['wrapperClass', 'messageId', 'profileId'])

// store
const chatRoomStore = useChatRoomStore()
const { handleResetActiveSelectReactions, handleSetActiveSelectReactions } = chatRoomStore
const { activeSelectReactions, chatRoom } = storeToRefs(chatRoomStore)

const emojiButtonRef = ref(null)
const emojiMenuRef = ref(null)
const moreEmojiPanelRef = ref(null)

const emojis = ref([
  { emoji: '👍', type: 'emoji' },
  { emoji: '❤️', type: 'emoji' },
  { emoji: '😂', type: 'emoji' },
  { emoji: '😮', type: 'emoji' },
  { type: 'add-more-reaction' },
])

const isActiveMenu = computed(() => {
  return activeSelectReactions.value?.messageId === messageId
})

const isActiveMoreEmoji = computed(() => {
  if (activeSelectReactions.value?.type === 'default-reaction') return
  return activeSelectReactions.value?.messageId === messageId
})
const memoizedChatRoomId = computed(() => {
  return chatRoom.value?.chatRoomId
})
const memoizedChatId = computed(() => {
  return chatRoom.value?.chatId
})

const submitReactionMessage = (emoji, code) => {
  const req = {
    chatRoomId: memoizedChatRoomId.value,
    chatId: memoizedChatId.value,
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
  const customData = event?.customData
  if (customData) {
    moreEmojiPanelRef.value.toggle(event)
    event.stopPropagation();
    return
  }
  if (isActiveMoreEmoji.value) {
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
  if (isActiveMenu.value) {
    handleResetActiveSelectReactions()
    return
  }
  handleSetActiveSelectReactions('default-reaction', messageId, profileId)
}
</script>

<template>
  <div :class="`group/emoji flex w-full items-center relative gap-1.5 ${wrapperClass}`" @click="onTouchStart">
    <!-- Tombol emoji -->
    <Button icon="pi pi-face-smile" text rounded size="small"
      :class="`!w-7 !h-7 items-center justify-center absolute ${isActiveMenu ? 'opacity-100' : 'opacity-0'} group-hover/emoji:opacity-100 !bg-[#A1A1A1] shadow border rotate-180 !text-white`"
      @click.stop="toggleEmojiMenu" ref="emojiButtonRef" />

    <!-- Menu as emoji picker -->
    <Menu @show="onShow" @hide="onHide" ref="emojiMenuRef" :popup="true"
      :class="`!min-w-fit !h-fit !pb-0 ${isActiveMoreEmoji ? '!rounded-lg' : '!rounded-full'}`">
      <template #start>
        <div class="grid grid-cols-5 gap-1 !py-1 px-2 !h-fit">
          <button v-for="emoji in emojis" :key="emoji"
            class="flex items-center justify-center w-9 h-9 rounded-full hover:scale-110 transition-transform"
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
    <Menu ref="moreEmojiPanelRef" :popup="true" @show="onShowMoreEmoji" @hide="onHide">
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
