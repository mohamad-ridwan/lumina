<script setup>
import { ref, defineProps, onUnmounted, computed, onBeforeMount, shallowRef, triggerRef, watch } from 'vue'
import { useChatRoomStore } from '@/stores/chat-room'
import { storeToRefs } from 'pinia'
import { general } from '@/helpers/general'
import MenuCard from './MenuCard.vue'

// store
// chat-room store
const chatRoomStore = useChatRoomStore()
const { handleActiveMessageMenu, resetActiveMessageMenu, handleSetReplyMessageData, handleSetConfirmDeleteMessage, handleResetActiveSelectReactions } = chatRoomStore
const { activeMessageMenu, chatRoom } = storeToRefs(chatRoomStore)

const { deviceDetector } = general

const props = defineProps({
  message: Object,
  profileId: String,
  isDeleted: Array,
  messageDeleted: Boolean
})

const menu = ref(null)
const deviceCurrently = ref(null)
const items = shallowRef([
  {
    label: 'Reply',
    command: () => {
      handleSetReplyMessageData(props.message)
    }
  },
  {
    label: 'Delete',
    command: () => {
      handleSetConfirmDeleteMessage({
        chatRoomId: chatRoom.value?.chatRoomId,
        chatId: chatRoom.value?.chatId,
        messageId: props.message?.messageId,
        senderUserId: props.message?.senderUserId,
        profileId: props.profileId,
        isDeleted: props.isDeleted,
        secondProfileId: chatRoom.value?.userIds?.find(id => id !== props.profileId)
      })
    }
  },
])

// const memoizedMenuStyle = computed(() => {
//   if (deviceCurrently.value === 'mobile') {
//     return `margin-bottom: 40px; direction: ltr !important; rotate: 180deg !important; display: block !important; ${props.message.senderUserId === props.profileId ? '' : 'right: 0px;'}`
//   }
//   return
// })
const memoizedMenuClass = computed(() => {
  if (deviceCurrently.value === 'mobile') {
    const positionClass = props.message.senderUserId === props.profileId ? '' : 'right-0'
    return [
      'mb-10',         // margin-bottom: 40px
      'rotate-180',    // rotate: 180deg
      'block',// display: block
      positionClass    // conditional right-0
    ].join(' ')
  }
  return ''
})

watch(props, (props) => {
  if (props.messageDeleted) {
    items.value = items.value.filter(menu => menu.label !== 'Reply')
    triggerRef(items)
  }
}, { immediate: true })

const toggle = (event) => {
  menu.value.menu.toggle(event)
  if (activeMessageMenu.value === props.message.messageId) {
    resetActiveMessageMenu()
  } else {
    handleActiveMessageMenu(props.message.messageId)
  }
  event.stopPropagation()
}

const handleResetMenu = () => {
  setTimeout(() => {
    resetActiveMessageMenu()
  }, 0);
}

const onHide = () => {
  clearTimeout(handleResetMenu)
  handleResetMenu()
  handleResetActiveSelectReactions()
}

const onShow = () => {
  handleActiveMessageMenu(props.message.messageId)
}

const checkDevice = () => {
  setInterval(() => {
    deviceCurrently.value = deviceDetector()
  }, 1000);
}

onBeforeMount(() => {
  deviceCurrently.value = deviceDetector()
  checkDevice()
})

onUnmounted(() => {
  clearInterval(checkDevice)
})
</script>

<template>
  <div class="flex flex-col">
    <MenuCard ref="menu" :menu-class="`!text-[13px] absolute top-6 !min-w-[100px] !flex ${memoizedMenuClass}`"
      :items="items" :toggleMenu="toggle" btnMenuIcon="pi pi-ellipsis-v" @show="onShow" @hide="onHide"
      :append-to="deviceCurrently === 'desktop' ? 'body' : 'self'" btn-icon-class="pi pi-angle-up"
      btn-menu-class="!rounded-md !h-5 !w-4 !text-white !bg-[#7d8494] !border-[0.3px]"
      :btn-menu-aria-controls="`overlay_menu_${props.message?.messageId}`" btn-menu-aria-haspopup="true"
      :btn-menu-rounded="true" btn-menu-severity="secondary" btn-menu-aria-label="More" item-direction="ltr" />

    <!-- <MenuCard ref="menu" :menu-class="`!text-[13px] absolute top-6 !min-w-[100px] !flex ${memoizedMenuClass}`"
      :id="`overlay_menu_${props.message?.messageId}`" :items="items" :toggleMenu="toggle"
      btnMenuIcon="pi pi-ellipsis-v" @show="onShow" @hide="onHide"
      :append-to="deviceCurrently === 'desktop' ? 'body' : 'self'" btn-icon-class="pi pi-angle-up"
      btn-menu-class="!rounded-md !h-5 !w-4 !text-white !bg-[#7d8494] !border-[0.3px]"
      :btn-menu-aria-controls="`overlay_menu_${props.message?.messageId}`" btn-menu-aria-haspopup="true"
      :btn-menu-rounded="true" btn-menu-severity="secondary" btn-menu-aria-label="More" item-direction="ltr" /> -->
  </div>
</template>
