<script setup>
import { usersStore } from '@/stores/users';
import FooterChatRoom from './footer/FooterChatRoom.vue';
import HeaderChatRoom from './HeaderChatRoom.vue';
import SenderMessage from './SenderMessage.vue';
import RecipientMessage from './RecipientMessage.vue';
import { computed, nextTick, onBeforeUnmount, onMounted, onUnmounted, ref, shallowRef, toRaw, triggerRef, watch } from 'vue';
import { socket } from '@/services/socket/socket';
// import SpamMessage from '@/spam-message/SpamMessage.vue'
import { useChatRoomStore } from '@/stores/chat-room';
import { ITEMS_PER_PAGE, SCROLL_THRESHOLD, } from '@/utils/pagination';
import { storeToRefs } from 'pinia';
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller';
import { Button } from 'primevue';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import isToday from 'dayjs/plugin/isToday';
import isYesterday from 'dayjs/plugin/isYesterday';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import weekday from 'dayjs/plugin/weekday';
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import DateHeader from './DateHeader.vue';
import UserTypingIndicator from './UserTypingIndicator.vue';
import SkeletonMessages from './SkeletonMessages.vue';
import { fetchMessagesPagination } from '@/services/api/chat-room';
import { general } from '@/helpers/general';
import WrapperSetHeaderTimes from '@/components/WrapperSetHeaderTimes.vue';
import { generateRandomId } from '@/helpers/generateRandomId';

dayjs.extend(isToday);
dayjs.extend(isYesterday);
dayjs.extend(weekOfYear);
dayjs.extend(weekday);
dayjs.extend(utc);
dayjs.extend(timezone);

dayjs.tz.setDefault("Asia/Jakarta");

const { sortByTimestamp, removeDuplicates, messageMatching, formatDate, dateWithHours, captionMediaGallery, mediaGalleryData, HTML_usernameOnCaptionMediaGallery, HTML_subHtmlOnCaptionMediaGallery, base64ToBlob } = general

// store
// profile store
const userStore = usersStore()
const { profile, profileIdConnection } = storeToRefs(userStore)
// chat-room store
const chatRoomStore = useChatRoomStore()
const { setChatRoomMessages, setChatRoom, resetChatRoomEventSource, handleSetAddNewMessageWorker, handleStopAddNewMessageWorker, handleStopGetChatRoomWorker, handleStopStreamsChatRoomWorker, resetAddNewMessageEventSource, handleGetMainMessagesOnScrollBottom, resetMainMessagesWorkerOnScrollBottom, resetMainMessagesEventSource, resetMainMessagesWorker, resetPaginationMessagesComparisonWorker, resetReplyMessageData, resetActiveMessageMenu, handleResetActiveSelectReactions, handleResetConfirmDeleteMessage, resetTotalStreamsLength, setDataStreamsToIndexedDB, handleResetAttachment, handleResetActiveMediaData, handleGetMediaOnSliderChange } = chatRoomStore
const {
  chatRoom,
  chatRoomMessages,
  loadingMessages,
  chatRoomEventSource,
  headerRefs,
  addNewMessageWorker,
  scroller,
  showScrollDownButton,
  loadingMessagesPagination,
  isStartIndex,
  bufferNewMessages,
  loadingAddNewMessageEventSource,
  loadingMainMessagesOnScrollBottom,
  bufferNewMessagesOnScrollBottom,
  bufferMainMessagesEventSource,
  loadingMainMessagesEventSource,
  paginationMessagesComparisonWorker,
  goingScrollToMessageId,
  loadingScrollToGoMessageId,
  updateStreamsToIndexedDB,
  streamsChatRoomWorker,
  totalStreamsLength,
  totalStreamsChatRoomWorkerDones,
  stayScrollCurrently,
  usersTyping,
  lightboxEl,
  galleryInstance,
  mediaGallery,
  resetKeyModalReactions,
  triggerScrollToMessageIdIsDone,
  mediaMessageProgress
} = storeToRefs(chatRoomStore)

// state
const observer = ref(null)
const currentStickyHeader = shallowRef({
  latestMessageTimestamp: 0,
  text: ''
})
const showDateHeader = shallowRef(false)
// const memoizedChatRoomDataWithHeaders = ref([]);
const isUserInitiatedScroll = shallowRef(false)
const scrollTimeout = shallowRef(null)
const scrollTimeOutDateHeader = shallowRef(null)
const typingBubbleEl = ref(null)
const newMessageUpdate = ref(null)
const mediaMessageProgressUpdate = ref(null)
const mediaMessageProgressDoneUpdate = ref(null)

// logic
const memoizedChatRoomId = computed(() => {
  return chatRoom.value?.chatRoomId
})
const memoizedChatId = computed(() => {
  return chatRoom.value?.chatId
})
const profileId = computed(() => profile.value?.data?.id ?? null)
const memoizedUserIdCurrently = computed(() => {
  return memoizedUserIds.value?.find(id => id !== profile.value?.data.id)
})
const isUserTyping = computed(() => {
  return usersTyping.value.find(type => type?.senderId === memoizedUserIdCurrently.value && type?.recipientId === profileId.value)
})
const memoizedMessages = computed(() => {
  if (!chatRoomMessages.value) {
    return []
  }

  if (isUserTyping.value) {
    return [{
      id: 'typing',
      messageId: 'typing',
      isTyping: true
    }, ...chatRoomMessages.value?.map(chat => {
      if (chat?.isHeader) {
        const itemDate = dayjs(Number(chat?.latestMessageTimestamp)).startOf('day')
        return { ...chat, headerText: formatDate(itemDate) }
      }
      return chat
    })].sort((a, b) => sortByTimestamp(a, b, profileId.value))
  }

  return chatRoomMessages.value.map(chat => {
    if (chat?.isHeader) {
      const itemDate = dayjs(Number(chat?.latestMessageTimestamp)).startOf('day')
      return { ...chat, headerText: formatDate(itemDate) }
    }
    return chat
  }).sort((a, b) => sortByTimestamp(a, b, profileId.value))
})
const memoizedUserIds = computed(() => {
  return chatRoom.value?.userIds
})

const scrollToBottom = () => {
  if (scroller.value) {
    handleGetMainMessagesOnScrollBottom(profileId.value)
  }
};
function handleBeforeUnload() {
  if (memoizedChatId.value) {
    socket.emit('leaveRoom', {
      chatRoomId: memoizedChatRoomId.value,
      chatId: memoizedChatId.value,
      userId: profile?.data.id
    })
  }
}

function setHeaderRef(el, item) {
  // if (!item?.latestMessageTimestamp) return

  // const key = item.id // bisa juga pakai uniqueKey kalau ada
  // if (el) {
  //   headerRefs.value[key] = el
  // } else {
  //   delete headerRefs.value[key]
  // }
}

const onScroll = () => {
  const containerRect = scroller.value?.$el?.getBoundingClientRect()
  if (!containerRect) return

  const containerBottom = containerRect.top // karena rotate 180
  const itemElements = Object.values(headerRefs.value || {}) // semua item, bukan cuma header

  let closestItem = null
  let minDistance = Infinity

  const newItemElements = itemElements.sort((a, b) => {
    const aTime = Number(a.id.split('-')[1])
    const bTime = Number(b.id.split('-')[1])
    return bTime - aTime
  })
  newItemElements.forEach((el) => {
    const rect = el.getBoundingClientRect()
    const visualBottom = rect.top
    const distance = Math.abs(visualBottom - containerBottom)

    const isAboveViewport = visualBottom <= containerBottom - 30
    const timestamp = Number(el.dataset.timestamp)

    if (isAboveViewport && distance < minDistance && !isNaN(timestamp)) {
      minDistance = distance
      closestItem = { timestamp, el }
    }
  })

  if (closestItem && closestItem.timestamp !== currentStickyHeader.value.latestMessageTimestamp) {
    currentStickyHeader.value = {
      latestMessageTimestamp: closestItem.timestamp,
      text: formatDate(closestItem.timestamp),
    }
  }
}

let previousScrollHeight = 0
let previousScrollTop = 0

const maintainScrollAfterInsert = async () => {
  const scrollTop = scroller.value?.$el?.scrollTop ?? 0
  if (scrollTop !== 0 && !showScrollDownButton.value) {
    const el = scroller.value?.$el
    el.scrollTop = 0
  }
  if (scrollTop === 0 || !showScrollDownButton.value) return

  await nextTick()
  const el = scroller.value?.$el
  if (!el) return

  const newScrollHeight = el.scrollHeight
  const scrollDiff = newScrollHeight - previousScrollHeight

  el.scrollTop = previousScrollTop + scrollDiff
}

watch(chatRoomMessages, async (data, oldData) => {
  if (data.length === 0) {
    currentStickyHeader.value = {
      latestMessageTimestamp: 0,
      text: ''
    }
    headerRefs.value = {}
  }
  nextTick(() => {
    Object.values(headerRefs.value).forEach((el) => {
      if (el) observer.value?.observe(el)
    })
    onScroll()
  })

  const el = scroller.value?.$el
  if (el) {
    previousScrollHeight = el.scrollHeight
  }

  // handle scroll by new message
  const newItemCount = data.length - (oldData?.length || 0)
  // when recipient user send message,
  // just stay on current scrollTop

  if (!loadingMessagesPagination.value && isStartIndex.value && scroller.value) {
    scroller.value.scrollToItem(0)
    return
  }

  if (
    (newItemCount === 1 ||
      (data?.[0]?.latestMessageTimestamp !== oldData?.[0]?.latestMessageTimestamp))
    &&
    data[0]?.senderUserId !== profile.value?.data.id
  ) {
    maintainScrollAfterInsert()
  } else if (
    newItemCount === 1 &&
    data[0]?.senderUserId === profile.value?.data.id &&
    (data?.[0]?.latestMessageTimestamp !== oldData?.[0]?.latestMessageTimestamp)
  ) {
    // if (el?.scrollTop !== undefined && el?.scrollTop !== 0) {
    //   el.scrollTop = 0
    // }
  }
}, { immediate: true })

watch(
  () => scroller.value,
  () => {
    nextTick(() => {
      onScroll()
    })
  },
  { immediate: true }
)

onMounted(() => {
  socket.on('newMessage', (data) => {
    newMessageUpdate.value = data
  })
})

const handleUpdateReactions = async (newData) => {
  const data = toRaw(newData)
  const messageIndex = toRaw(chatRoomMessages.value).findIndex(message => message.messageId === data.messageId)
  let reactionIndex = toRaw(chatRoomMessages.value).find(message => message.messageId === data.messageId)
  if (messageIndex !== -1 && reactionIndex && !data?.isDeleted) {
    reactionIndex = reactionIndex?.reactions?.findIndex(react => react.senderUserId === data.reaction.senderUserId)
    let newReactions = chatRoomMessages.value[messageIndex].reactions
    if (reactionIndex === -1 || (newReactions?.length > 0 && newReactions?.find(react => react.senderUserId === data.reaction.senderUserId) === undefined) || newReactions?.length === 0) {
      newReactions.push(data.reaction)
    } else if (reactionIndex === -1 || reactionIndex === undefined || newReactions === undefined) {
      newReactions = [data.reaction]
    } else {
      newReactions[reactionIndex].emoji = data.reaction.emoji
      newReactions[reactionIndex].latestMessageTimestamp = data.reaction.latestMessageTimestamp
      newReactions[reactionIndex].code = data.reaction.code
    }
    // new reference of nested field
    // because it is would triggering render
    chatRoomMessages.value[messageIndex].reactions = [...newReactions]
    // paginationMessagesComparisonWorker.value.postMessage({
    //   chatRoomId: memoizedChatRoomId.value,
    //   chatId: memoizedChatId.value,
    //   streams: [toRaw(chatRoomMessages.value).find(message => message.messageId === data.messageId)]
    // })
    triggerRef(chatRoomMessages)
    await nextTick()
    await nextTick()
    scroller.value.$refs.scroller.$forceUpdate(true)
  } else if (messageIndex !== -1 && reactionIndex && data?.isDeleted) {
    reactionIndex = reactionIndex?.reactions?.findIndex(react => react.senderUserId === data.reaction.senderUserId)
    if (reactionIndex === -1 || reactionIndex === undefined) {
      return
    }
    let newReactions = chatRoomMessages.value[messageIndex].reactions
    newReactions = newReactions.filter(react => react.senderUserId !== data.reaction.senderUserId)
    // new reference of nested field
    // because it is would triggering render
    chatRoomMessages.value[messageIndex].reactions = [...newReactions]
    // paginationMessagesComparisonWorker.value.postMessage({
    //   chatRoomId: memoizedChatRoomId.value,
    //   chatId: memoizedChatId.value,
    //   streams: [toRaw(chatRoomMessages.value).find(message => message.messageId === data.messageId)]
    // })
    triggerRef(chatRoomMessages)
    await nextTick()
    await nextTick()
    scroller.value.$refs.scroller.$forceUpdate(true)
  }
}

function forceUpdateCaption(index, media) {
  const currentItem = media[index]

  // Update caption into the DOM
  const subHtmlContainer = document.querySelector('.lg-sub-html')
  if (subHtmlContainer) {
    subHtmlContainer.innerHTML = HTML_subHtmlOnCaptionMediaGallery(currentItem)
  }
}

const handleUpdateDeleteMessage = async (newData) => {
  const data = toRaw(newData)
  const messageIndex = toRaw(chatRoomMessages.value).findIndex(message => message.messageId === data.messageId)
  if (messageIndex !== -1 && data?.isDeleted && data?.isDeleted?.length) {
    // const messageData = chatRoomMessages.value[messageIndex]
    // const isDeletedUserIdCurrently = data.isDeleted.find(msg => msg.senderUserId === profileId.value)
    let isDeletedMessage = false
    data.isDeleted.forEach(msg => {
      if (msg.senderUserId === profileId.value && (msg.deletionType === 'me' || msg.deletionType === 'permanent')) {
        isDeletedMessage = true
      }
    })
    if (isDeletedMessage) {
      chatRoomMessages.value = [...chatRoomMessages.value.filter(message => message.messageId !== data.messageId)]
      chatRoomMessages.value = messageMatching(chatRoomMessages.value, chatRoomMessages.value)
      // save to indexedDB
      // paginationMessagesComparisonWorker.value.postMessage({
      //   chatRoomId: chatRoom.value?.chatRoomId,
      //   messageId: data.messageId,
      //   type: 'delete-message',
      // })
    } else {
      // new reference of nested field
      // because it is would triggering render
      chatRoomMessages.value[messageIndex].isDeleted = [...data.isDeleted]

      // update message to indexedDB
      // paginationMessagesComparisonWorker.value.postMessage({
      //   chatRoomId: memoizedChatRoomId.value,
      //   chatId: memoizedChatId.value,
      //   streams: [toRaw(chatRoomMessages.value).find(message => message.messageId === data.messageId)]
      // })
    }
    triggerRef(chatRoomMessages)
    await nextTick()
    await nextTick()
    scroller.value.$refs.scroller.$forceUpdate(true)

    // delete file from media if deleted is document
    const mediaMessageIndex = mediaGallery.value.findIndex(media => media?.messageId === data?.messageId)
    const isMeDelete = data?.isDeleted?.find(user => {
      return user?.senderUserId === profileId.value
    })
    const isSecondUserDelete = data?.isDeleted?.find(user => user?.senderUserId !== profileId.value)
    if (mediaMessageIndex === -1 || (!isMeDelete?.senderUserId && isSecondUserDelete?.deletionType === 'me')) {
      return
    }
    const mediaMessageId = mediaGallery.value.find(media => media?.messageId === data?.messageId)?.messageId
    mediaGallery.value = mediaGallery.value.filter(msg => msg?.messageId !== mediaMessageId)
    triggerRef(mediaGallery)
    if (galleryInstance.value) {
      const media = mediaGalleryData(mediaGallery.value, profileId.value, chatRoom.value?.username)
      const nextIndex = mediaMessageIndex >= mediaGallery.value.length ? mediaGallery.value.length - 1 : mediaMessageIndex
      galleryInstance.value.updateSlides(captionMediaGallery(media), nextIndex)
      await nextTick()
      forceUpdateCaption(nextIndex, media, dateWithHours)
    }
  }
}

watch(newMessageUpdate, (data) => {
  if (data?.eventType === 'reaction-message' && data?.chatRoomId === memoizedChatRoomId.value) {
    handleUpdateReactions(data)
  } else if (data?.eventType === 'delete-message' && data?.chatRoomId === memoizedChatRoomId.value) {
    handleUpdateDeleteMessage(data)
  }
})

// onBeforeMount(() => {
//   if (!addNewMessageWorker.value) {
//     handleSetAddNewMessageWorker()
//   }
// })

onBeforeUnmount(() => {
  if (addNewMessageWorker.value) {
    handleStopAddNewMessageWorker()
  }
})

const preventBackNavigation = () => {
  handleResetConfirmDeleteMessage()
  if (chatRoomEventSource.value) {
    resetChatRoomEventSource()
  }
  if (memoizedChatId.value) {
    socket.emit('leaveRoom', {
      chatRoomId: memoizedChatRoomId.value,
      chatId: memoizedChatId.value,
      userId: profile.value?.data.id
    })
  }
  setTimeout(() => {
    history.pushState(null, "", window.location.href)
  }, 100)
  setChatRoom({})
  setChatRoomMessages([])
}

onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload);
  history.pushState(null, "", window.location.href)
  window.addEventListener('popstate', preventBackNavigation)
});

// ini tetap diberikan karena mungkin nanti ada view component lain
// dan begitu posisi ada di chat room, dan mau ke view component tersebut udah dipastikan leave room
onUnmounted(() => {
  // leave room
  if (memoizedChatId.value) {
    socket.emit('leaveRoom', {
      chatRoomId: memoizedChatRoomId.value,
      chatId: memoizedChatId.value,
      userId: profile?.data.id
    })
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload);

  // ini tetap diberikan karena mungkin nanti ada view component lain
  // dan begitu posisi ada di chat room, dan mau ke view component tersebut udah dipastikan leave room
  if (memoizedChatId.value) {
    socket.emit('leaveRoom', {
      chatRoomId: memoizedChatRoomId.value,
      chatId: memoizedChatId.value,
      userId: profile.value?.data.id
    })
  }
})

watch(loadingMessages, (loading) => {
  if (loading) {
    showScrollDownButton.value = false
  }
}, { immediate: true })

watch(loadingMessages, async (loading) => {
  if (loading) return
  await nextTick()

  const el = scroller.value?.$el; // atau scroller container

  if (el) {
    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      el.scrollTop -= e.deltaY;
    }, { passive: false });
  }
})

const markUserScroll = () => {
  isUserInitiatedScroll.value = true
  // Reset otomatis dalam beberapa ms
  clearTimeout(scrollTimeout.value)
  scrollTimeout.value = setTimeout(() => {
    isUserInitiatedScroll.value = false
  }, 100)
}

const scrollStop = () => {
  clearTimeout(scrollTimeOutDateHeader.value)
  if (showDateHeader.value) {
    scrollTimeOutDateHeader.value = setTimeout(() => {
      showDateHeader.value = false
    }, 500);
  }
}

watch(isUserTyping, async (newVal, oldVal) => {
  const el = scroller.value?.$el
  if (!el) return

  const prevScrollHeight = el.scrollHeight
  const prevScrollTop = el.scrollTop

  if (prevScrollTop !== 0 && !showScrollDownButton.value && newVal) {
    el.scrollTop = 0
    return
  }

  await nextTick()

  const newScrollHeight = el.scrollHeight

  // Hitung delta tinggi container karena typing bubble muncul/hilang
  const heightDiff = newScrollHeight - prevScrollHeight

  // Koreksi scrollTop agar posisi tetap stabil
  if (heightDiff !== 0) {
    el.scrollTop = prevScrollTop + heightDiff
  }
})

const handleGetMessagesPagination = async () => {
  const el = scroller.value?.$el
  if (!el) return

  const nearBottom =
    el.scrollTop + el.clientHeight >= el.scrollHeight - SCROLL_THRESHOLD

  if (el.scrollTop === 0 && toRaw(chatRoomMessages.value).length > ITEMS_PER_PAGE) {
    chatRoomMessages.value = [...chatRoomMessages.value.slice(0, ITEMS_PER_PAGE)]
    await nextTick()
    await nextTick()
    triggerRef(chatRoomMessages)
    scroller.value.$refs.scroller.$forceUpdate(true)
  }

  if (
    loadingMainMessagesOnScrollBottom.value ||
    loadingMessagesPagination.value ||
    (
      (el.scrollTop > SCROLL_THRESHOLD && !nearBottom) ||
      chatRoomMessages.value.length === 0
    ) ||
    loadingAddNewMessageEventSource.value
  ) return

  let direction = null

  if (el.scrollTop < SCROLL_THRESHOLD && !nearBottom) {
    direction = 'prev'
  } else if (nearBottom) {
    direction = 'next'
    if (loadingMainMessagesEventSource.value) {
      return
    }
  }

  bufferNewMessages.value = []
  loadingMessagesPagination.value = true

  const result = await fetchMessagesPagination({
    chatRoomId: memoizedChatRoomId.value,
    chatId: memoizedChatId.value,
    messageId: direction === 'prev' ? chatRoomMessages.value[0]?.messageId : chatRoomMessages.value[chatRoomMessages.value.length - 1]?.messageId,
    direction,
    profileId: profileId.value
  })

  let newData = []
  let newChatRoomMessages = []

  if (result?.data?.length > 0) {
    newData = result.data.map((item => ({
      ...item,
      id: item.messageId,
      chatRoomId: memoizedChatRoomId.value,
      chatId: memoizedChatId.value,
    })))
  }

  // if (newData.length > 0) {
  //   // save to indexedDB if is not already in indexedDB
  //   paginationMessagesComparisonWorker.value.postMessage({
  //     chatRoomId: memoizedChatRoomId.value,
  //     chatId: memoizedChatId.value,
  //     streams: newData
  //   })
  // }

  if (result?.meta?.direction === 'prev' && result?.data?.length > 0) {
    newChatRoomMessages = [
      ...newData,
      ...chatRoomMessages.value
    ]
  } else if (result?.meta?.direction === 'next' && result?.data?.length > 0) {
    newChatRoomMessages = [
      ...chatRoomMessages.value,
      ...newData,
    ]
  }

  let newMessagesCurrently = []

  if (newData.length > 0) {
    newMessagesCurrently = removeDuplicates(newChatRoomMessages, 'messageId', profileId.value).sort((a, b) => sortByTimestamp(a, b, profileId.value))
    chatRoomMessages.value = [...newMessagesCurrently]
    await nextTick()
    await nextTick()
    triggerRef(chatRoomMessages)
    scroller.value.$refs.scroller.$forceUpdate(true)

    if (result?.meta?.direction === 'prev') {
      await nextTick()
      await nextTick()
      triggerRef(chatRoomMessages)
      scroller.value.$refs.scroller.$forceUpdate(true)

      const newScrollHeight = el.scrollHeight
      const scrollDiff = newScrollHeight - previousScrollHeight

      el.scrollTop = previousScrollTop + scrollDiff

      // newMessagesCurrently = toRaw(chatRoomMessages.value).sort(sortByTimestamp).slice(0, ITEMS_PER_PAGE)
      // chatRoomMessages.value = [...newMessagesCurrently]
      // await nextTick()
      // await nextTick()
      // triggerRef(chatRoomMessages)
      // scroller.value.$refs.scroller.$forceUpdate(true)
    } else if (result?.meta?.direction === 'next' && toRaw(chatRoomMessages.value).length >= ITEMS_PER_PAGE) {
      // await nextTick()
      // await nextTick()

      // newMessagesCurrently = toRaw(chatRoomMessages.value).sort(sortByTimestamp).slice(result.data.length)
      // chatRoomMessages.value = [...newMessagesCurrently]
      await nextTick()
      await nextTick()
      triggerRef(chatRoomMessages)
      scroller.value.$refs.scroller.$forceUpdate(true)

      // if (chatRoomMessages.value[0]?.senderUserId === profile.value?.data.id) {
      //   nextTick(() => {
      //     const newScrollHeight = el.scrollHeight
      //     const scrollDiff = newScrollHeight - previousScrollHeight

      //     el.scrollTop = previousScrollTop + scrollDiff
      //   })
      // }
    }
  }

  if (result?.meta?.direction === 'prev' && result?.data?.length === 0) {
    if (showScrollDownButton.value) {
      isStartIndex.value = false
    } else {
      isStartIndex.value = true
    }
  } else if (result?.meta?.direction === 'prev' && result?.data?.length > 0) {
    isStartIndex.value = false
  }
  loadingMessagesPagination.value = false
  if (result?.meta?.direction === 'next' && result?.data?.length > 0) {
    isStartIndex.value = false
  }
}

const handleScroll = () => {
  const el = scroller.value?.$el
  if (!el) return

  const scrollTop = scroller.value?.$el?.scrollTop ?? 0
  previousScrollTop = scrollTop
  previousScrollHeight = el.scrollHeight

  handleGetMessagesPagination()

  if (!loadingMessagesPagination.value && scrollTop > SCROLL_THRESHOLD) {
    isStartIndex.value = false
  } else if (!loadingMessagesPagination.value && scrollTop < SCROLL_THRESHOLD) {
    isStartIndex.value = true
  }

  const typingBubbleHeight = typingBubbleEl.value?.getBoundingClientRect()?.height
  if (typingBubbleHeight && typingBubbleHeight === scrollTop) {
    typingBubbleEl.value = null
    el.scrollTop = 0
  }

  showScrollDownButton.value = scrollTop > SCROLL_THRESHOLD

  if (isUserInitiatedScroll.value) {
    handleResetActiveSelectReactions()
    resetActiveMessageMenu()
    showDateHeader.value = true
    nextTick(() => {
      onScroll()
    })
  } else if (scrollTop === 0) {
    showScrollDownButton.value = scrollTop > SCROLL_THRESHOLD
  }
  scrollStop()
}

const handleScrollComponent = () => {
  resetKeyModalReactions.value = true
}

watch(loadingMessages, async (loading) => {
  if (loading) return

  await nextTick()

  const el = scroller.value?.$el
  if (!el) return

  el.removeEventListener('wheel', markUserScroll)
  el.removeEventListener('touchstart', markUserScroll)
  el.removeEventListener('touchmove', markUserScroll)
  el.removeEventListener('pointerdown', markUserScroll)
  el.removeEventListener('scroll', handleScroll)

  // Tangkap gesture dari user
  el.addEventListener('wheel', markUserScroll, { passive: true })
  el.addEventListener('touchstart', markUserScroll, { passive: true })
  el.addEventListener('touchmove', markUserScroll, { passive: true })
  el.addEventListener('pointerdown', markUserScroll, { passive: true })

  // Scroll listener
  el.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  const el = scroller.value?.$el
  if (!el) return

  el.removeEventListener('wheel', markUserScroll)
  el.removeEventListener('touchstart', markUserScroll)
  el.removeEventListener('touchmove', markUserScroll)
  el.removeEventListener('pointerdown', markUserScroll)
  el.removeEventListener('scroll', handleScroll)
})

watch(loadingMessagesPagination, async (isLoading) => {
  if (
    !isLoading &&
    !showScrollDownButton.value &&
    isStartIndex.value &&
    bufferNewMessages.value.length > 0
  ) {
    chatRoomMessages.value = removeDuplicates([
      ...bufferNewMessages.value,
      ...chatRoomMessages.value
    ], 'messageId', profileId.value).sort((a, b) => sortByTimestamp(a, b, profileId.value))
    await nextTick()
    await nextTick()
    triggerRef(chatRoomMessages)
    scroller.value.$refs.scroller.$forceUpdate(true)

    chatRoomMessages.value = chatRoomMessages.value.sort((a, b) => sortByTimestamp(a, b, profileId.value)).slice(0, ITEMS_PER_PAGE)
    await nextTick()
    await nextTick()
    triggerRef(chatRoomMessages)
    scroller.value.$refs.scroller.$forceUpdate(true)
    bufferNewMessages.value = []
  }
})

// update streams to indexedDB
watch(updateStreamsToIndexedDB, (streams) => {
  if (streamsChatRoomWorker.value && streams) {
    streamsChatRoomWorker.value.postMessage({
      chatRoomId: memoizedChatRoomId.value,
      chatId: memoizedChatId.value,
      streams
    })
  }
}, { immediate: true })

watch(streamsChatRoomWorker, (worker) => {
  if (worker) {
    worker.onmessage = (event) => {
      totalStreamsChatRoomWorkerDones.value += event.data
    }
  }
}, { immediate: true })

watch(totalStreamsLength, (length) => {
  if (length === totalStreamsChatRoomWorkerDones.value) {
    handleStopStreamsChatRoomWorker()
    totalStreamsChatRoomWorkerDones.value = 0
  }
})

onBeforeUnmount(() => {
  lightboxEl.value?.removeEventListener('lgBeforeSlide', handleGetMediaOnSliderChange)
  galleryInstance.value?.destroy?.(true)
  lightboxEl.value = null
  galleryInstance.value = null
  mediaGallery.value = []
})

onUnmounted(() => {
  loadingMessages.value = false
  setChatRoomMessages([])
  window.removeEventListener('popstate', preventBackNavigation)
  scroller.value = null
  showScrollDownButton.value = false
  totalStreamsChatRoomWorkerDones.value = 0
  // mediaMessageProgress.value = []
  isStartIndex.value = true
  handleResetActiveMediaData()
  handleResetAttachment()
  handleStopGetChatRoomWorker()
  handleStopStreamsChatRoomWorker()
  resetAddNewMessageEventSource()
  resetMainMessagesWorkerOnScrollBottom()
  resetMainMessagesEventSource()
  resetMainMessagesWorker()
  resetPaginationMessagesComparisonWorker()
  handleResetConfirmDeleteMessage()
  resetReplyMessageData()
  resetActiveMessageMenu()
  setDataStreamsToIndexedDB(null)
  resetTotalStreamsLength()
  handleResetActiveSelectReactions()
  goingScrollToMessageId.value = null
  loadingScrollToGoMessageId.value = false
  loadingMainMessagesOnScrollBottom.value = false
  bufferNewMessagesOnScrollBottom.value = []
  bufferMainMessagesEventSource.value = []
})
</script>

<template>
  <!-- <SpamMessage v-once /> -->
  <div class="flex flex-col flex-1 overflow-hidden relative bg-[#f9fafb] border-l border-[#f1f1f1]">
    <HeaderChatRoom :recipient-id="memoizedUserIds.filter(id => id !== profile.data.id)?.[0]"
      :profile-id="profile.data.id" :profile-id-connection="profileIdConnection" />

    <!-- <div v-if="currentStickyHeader.text"
      :class="`absolute top-22 z-10 rotate-180 flex justify-center items-center left-2 right-[0.8rem] ${showDateHeader ? 'opacity-100' : 'opacity-0'} transition-all`">
      <DateHeader :date="currentStickyHeader.text" />
    </div> -->

    <SkeletonMessages v-if="loadingMessages" />

    <DynamicScroller @scroll="handleScrollComponent" v-if="!loadingMessages" id="scrollChatRoom" ref="scroller"
      :items="memoizedMessages" :key-field="'messageId'" :min-item-size="30"
      class="flex-1 space-y-2 bg-[#f9fafb] !py-4 !px-2"
      style="display: flex; flex-direction: column; transform: rotate(180deg); direction: rtl; -webkit-overflow-scrolling: touch;">
      <template v-slot="{ item, index, active }">
        <DynamicScrollerItem :data-index="index" :item="item" :active="active" :size-dependencies="[
          item.textMessage,
        ]" :key="item.messageId">
          <div v-memo="[item?.messageId]" v-if="item?.isHeader"
            :id="`${item.messageId}-${item.latestMessageTimestamp}`">
            <DateHeader :date="formatDate(Number(item?.latestMessageTimestamp))" />
          </div>
          <WrapperSetHeaderTimes :item="item" v-on:set-header-ref="setHeaderRef">
            <SenderMessage
              v-memo="[item?.status, item?.reactions, item?.isDeleted, item?.document?.url, item?.document?.isCancelled, item?.document?.isProgressDone, item?.document?.progress, item?.document?.thumbnail, item?.document?.poster, item?.document?.dimension, item?.messageId]"
              v-if="item?.messageType && item.senderUserId === profile.data.id" :key="item?.messageId"
              :text-message="item.textMessage"
              :latest-message-timestamp="item?.completionTimestamp ? item?.completionTimestamp : item.latestMessageTimestamp"
              :status="item.status" :message-id="item.messageId" :message-type="item.messageType"
              :sender-user-id="item.senderUserId" :reply-view="item?.replyView" :profile-id="profileId"
              :reactions="item?.reactions" :is-deleted="item?.isDeleted" :document="item?.document" />
          </WrapperSetHeaderTimes>
          <WrapperSetHeaderTimes :item="item" v-on:set-header-ref="setHeaderRef">
            <RecipientMessage
              v-memo="[item?.reactions, item?.isDeleted, item?.document?.url, item?.document?.isCancelled, item?.document?.isProgressDone, item?.document?.progress, item?.document?.thumbnail, item?.document?.poster, item?.document?.dimension, item?.messageId]"
              v-if="item?.messageType && item.senderUserId !== profile.data.id" :key="item?.messageId"
              :text-message="item.textMessage"
              :latest-message-timestamp="item?.completionTimestamp ? item?.completionTimestamp : item.latestMessageTimestamp"
              :status="item.status" :chat-id="memoizedChatId" :chat-room-id="memoizedChatRoomId"
              :message-id="item.messageId" :message-type="item.messageType" :sender-user-id="item.senderUserId"
              :reply-view="item?.replyView" :profile-id="profileId" :reactions="item?.reactions"
              :is-deleted="item?.isDeleted" :document="item?.document" :product-data="item?.productData"
              :order-data="item?.orderData ?? []" />
          </WrapperSetHeaderTimes>
          <div v-if="item?.isTyping" ref="typingBubbleEl">
            <UserTypingIndicator />
          </div>
        </DynamicScrollerItem>
      </template>
    </DynamicScroller>

    <FooterChatRoom v-memo="[showScrollDownButton]">
      <Button @click="scrollToBottom"
        class="!absolute !right-4 !bg-white !h-[2rem] !w-[2rem] !shadow !rounded-full !duration-300 !ease-in-out !border-none !transition-all"
        :class="{ '!opacity-100': showScrollDownButton, '!opacity-0 pointer-events-none': !showScrollDownButton }"
        :style="`bottom: 20px;`" aria-label="Scroll to bottom" icon="pi pi-arrow-down !text-black !text-sm"
        iconPos="only" />
    </FooterChatRoom>
  </div>
</template>
