<script setup>
import { ref, defineProps, onUnmounted, computed, onBeforeMount, shallowRef, triggerRef, watch, toRefs } from 'vue'
import { useChatRoomStore } from '@/stores/chat-room'
import { storeToRefs } from 'pinia'
import { general } from '@/helpers/general'
import MenuCard from './MenuCard.vue'
import { Button } from 'primevue'

// store
// chat-room store
const chatRoomStore = useChatRoomStore()
const { handleActiveMessageMenu, resetActiveMessageMenu, handleSetReplyMessageData, handleSetConfirmDeleteMessage, handleResetActiveSelectReactions } = chatRoomStore
const { activeMessageMenu, chatRoom, typeDevice, resetKeyModalReactions } = storeToRefs(chatRoomStore)

const { deviceDetector, computeSafePosition } = general

const props = defineProps({
  message: Object,
  profileId: String,
  isDeleted: Array,
  messageDeleted: Boolean
})

const { messageDeleted, message } = toRefs(props)

const menu = ref(null)
const deviceCurrently = ref(null)
const mobileBtnMenuRef = ref(null)
const currentPositionMobileBtnMenu = ref({ top: '', left: '' })
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

const memoizedDataComputed = computed(() => {
  const mobilePosition = `top: ${computeSafePosition(currentPositionMobileBtnMenu.value.left, currentPositionMobileBtnMenu.value.top).top}px !important; inset-inline-start: ${computeSafePosition(currentPositionMobileBtnMenu.value.left, currentPositionMobileBtnMenu.value.top).left}px !important;`

  const memoizedMenuClass = () => {
    if (deviceCurrently.value === 'mobile') {
      const positionClass = props.message.senderUserId === props.profileId ? '' : 'right-0'
      return [
        'mb-10',         // margin-bottom: 40px
        '!rotate-0',    // rotate: 180deg
        'block',// display: block
        positionClass,
      ].join(' ')
    }
    return ''
  }

  const isDesktop = typeDevice.value === 'desktop'

  return {
    memoizedMenuClass: memoizedMenuClass(),
    isDesktop,
    mobilePosition: !isDesktop ? mobilePosition : undefined,
  }
})

watch(() => [message.value?.document?.isProgressDone, message.value?.document?.isCancelled, message.value?.document?.progress], ([isProgressDone, isCancelled, progress], [oldIsProgressDone, oldIsCancelled, oldProgress]) => {
  if ((oldProgress !== 100) && (isProgressDone && !isCancelled)) {
    items.value.unshift({
      label: 'Reply',
      command: () => {
        handleSetReplyMessageData(props.message)
      }
    })
    triggerRef(items)
  }
})

watch([messageDeleted, activeMessageMenu, message], ([isDeleted, newActiveMessageMenu, newMessage]) => {
  if ((isDeleted && activeMessageMenu?.value?.messageId === message.value?.messageId) || (newMessage?.document?.progress !== undefined && (newMessage?.document?.isCancelled || !newMessage?.document?.isProgressDone))) {
    items.value = items.value.filter(menu => menu.label !== 'Reply')
    triggerRef(items)
  }
}, { immediate: true })

const toggle = (event) => {
  menu.value.menu.toggle(event)
  if (activeMessageMenu.value?.messageId === props.message.messageId) {
    resetActiveMessageMenu()
  } else {
    handleActiveMessageMenu({ messageId: props.message.messageId })
  }
  event.stopPropagation()
}
const toggleMobileMenu = async (event) => {
  menu.value.menu.toggle(event)
}

watch(activeMessageMenu, (newMenu) => {
  if (newMenu?.x !== undefined && newMenu?.messageId === message.value?.messageId && deviceDetector() === 'mobile') {
    const syntheticClickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window
    })
    if (mobileBtnMenuRef.value) {
      const top = Math.floor(newMenu.y)
      const left = Math.floor(newMenu.x)
      currentPositionMobileBtnMenu.value = {
        top: top,
        left: left
      }
      mobileBtnMenuRef.value.$el.dispatchEvent(syntheticClickEvent)
    }
  }
})

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
  if (deviceDetector() === 'desktop') {
    handleActiveMessageMenu({ messageId: props.message.messageId })
  }
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

watch(typeDevice, (newDevice, oldDevice) => {
  if (oldDevice && newDevice !== oldDevice) {
    resetActiveMessageMenu()
    handleResetActiveSelectReactions()
    if (menu.value?.menu) {
      menu.value.menu.hide()
      currentPositionMobileBtnMenu.value = {
        top: '',
        left: ''
      }
    }
  }
})

watch(resetKeyModalReactions, (reset) => {
  if (deviceDetector() === 'mobile' && reset) {
    menu.value?.menu?.hide()
  }
})
</script>

<template>
  <div class="flex flex-col">
    <Button ref="mobileBtnMenuRef" class="!hidden" @click="toggleMobileMenu"></Button>
    <MenuCard :key="props.message?.messageId" ref="menu"
      :menu-class="`!text-[13px] absolute !min-w-[100px] !max-w-fit !flex ${memoizedDataComputed.memoizedMenuClass}`"
      :menu-style="memoizedDataComputed.mobilePosition" :items="items" :toggleMenu="toggle"
      btnMenuIcon="pi pi-ellipsis-v" @show="onShow" @hide="onHide" :is-use-btn-toggle="memoizedDataComputed.isDesktop"
      :append-to="deviceCurrently === 'desktop' ? 'body' : 'body'" btn-icon-class="pi pi-angle-up"
      btn-menu-class="!rounded-md !h-5 !w-4 !text-white !bg-[#7d8494] !border-[0.3px]"
      :btn-menu-aria-controls="`overlay_menu_${props.message?.messageId}`" btn-menu-aria-haspopup="true"
      :btn-menu-rounded="true" btn-menu-severity="secondary" btn-menu-aria-label="More" item-direction="ltr" />
  </div>
</template>
