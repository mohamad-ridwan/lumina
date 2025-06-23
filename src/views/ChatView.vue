<script setup>
import { general } from '@/helpers/general';
import { generateRandomId } from '@/helpers/generateRandomId';
import ChatRoomLayout from '@/layout/chat-room/ChatRoomLayout.vue';
import ChatLayout from '@/layout/chat/ChatLayout.vue';
import ProfileLayoutWrapper from '@/layout/profile/ProfileLayoutWrapper.vue';
import { socket } from '@/services/socket/socket';
import { useChatRoomStore } from '@/stores/chat-room';
import { chatsStore } from '@/stores/chats';
import { usersStore } from '@/stores/users';
import { storeToRefs } from 'pinia';
import { computed, markRaw, nextTick, onBeforeMount, onBeforeUnmount, onMounted, onUnmounted, ref, shallowRef, toRaw, triggerRef, watch } from 'vue';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import isToday from 'dayjs/plugin/isToday';
import isYesterday from 'dayjs/plugin/isYesterday';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import weekday from 'dayjs/plugin/weekday';
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { ITEMS_PER_PAGE } from '@/utils/pagination';

dayjs.extend(isToday);
dayjs.extend(isYesterday);
dayjs.extend(weekOfYear);
dayjs.extend(weekday);
dayjs.extend(utc);
dayjs.extend(timezone);

dayjs.tz.setDefault("Asia/Jakarta");

const { deviceDetector, removeDuplicates, sortByTimestamp, formatDate } = general

// store
const userStore = usersStore()
const { profile } = storeToRefs(userStore)
// chats store
const chatStore = chatsStore()
const { chats, searchMessengerData, searchValue } = storeToRefs(chatStore)
// chat-room store
const chatRoomStore = useChatRoomStore()
const { handleUpdateUsersTyping } = chatRoomStore
const { usersTyping, typeDevice, mediaMessageProgress, chatRoom, chatRoomMessages, triggerScrollToMessageIdIsDone, loadingMainMessagesOnScrollBottom, showScrollDownButton, loadingMessagesPagination, isStartIndex, scroller } = storeToRefs(chatRoomStore)

// state
const userOnlineSocketUpdate = shallowRef({
  key: 0, // because need trigger different value
  id: null
})
const userOfflineSocketUpdate = shallowRef(null)
const typingStartSocketUpdate = shallowRef({
  key: 0,
  senderId: null,
  recipientId: null,
})
const typingStopSocketUpdate = shallowRef({
  key: 0,
  senderId: null,
  recipientId: null,
})
const mediaMessageProgressUpdate = ref(null)
const mediaMessageProgressDoneUpdate = ref(null)

// logic
const profileId = computed(() => profile.value?.data.id)
const memoizedChats = computed(() => chats.value)
const memoizedChatRoomId = computed(() => {
  return chatRoom.value?.chatRoomId
})
const memoizedChatsCurrently = computed(() => {
  return searchMessengerData.value
})

const handleDeviceDetector = () => {
  typeDevice.value = deviceDetector()
}

// hooks rendering
onMounted(() => {
  handleDeviceDetector()
  window.addEventListener('resize', handleDeviceDetector)

  socket.on('typing-start', (data) => {
    typingStartSocketUpdate.value = {
      ...data,
      key: typingStartSocketUpdate.value.key + 1
    }
  })
})

onMounted(() => {
  socket.on('media-message-progress', (message) => {
    mediaMessageProgressUpdate.value = message
  })
})

const handleUpdateMediaMessageProgress = (newMessage) => {
  if (newMessage.latestMessage.senderUserId === profileId.value && newMessage.chatRoomId === memoizedChatRoomId.value && chatRoomMessages.value.some(msg => msg?.messageId === newMessage.latestMessage.messageId)) {
    const messageIndex = mediaMessageProgress.value.findIndex(msg => msg?.latestMessage.messageId === newMessage.latestMessage.messageId)
    if (messageIndex === -1) {
      mediaMessageProgress.value.push(newMessage)
      mediaMessageProgress.value = [...mediaMessageProgress.value]
    } else {
      mediaMessageProgress.value[messageIndex] = newMessage
      mediaMessageProgress.value = [...mediaMessageProgress.value]
    }
    triggerRef(mediaMessageProgress)
  }
}

watch(mediaMessageProgressUpdate, (newMessage) => {
  handleUpdateMediaMessageProgress(newMessage)
})

const handleMediaMessageProgress = (newVideo) => {
  if (newVideo.length > 0) {
    const currentVideo = newVideo.find(msg => msg?.chatRoomId === memoizedChatRoomId.value)
    if (!currentVideo) {
      return
    }
    const indexVideoMessage = chatRoomMessages.value.findIndex(msg => msg?.messageId === currentVideo.latestMessage.messageId)
    if (indexVideoMessage !== -1) {
      let newMessage = chatRoomMessages.value[indexVideoMessage]
      newMessage.document = {
        ...chatRoomMessages.value[indexVideoMessage].document,
        progress: currentVideo.latestMessage.document.progress,
        isProgressDone: false,
        isCancelled: false
      }
      chatRoomMessages.value[indexVideoMessage] = newMessage
      triggerRef(chatRoomMessages)
    }
  }
}

watch(mediaMessageProgress, (newVideo) => {
  handleMediaMessageProgress(newVideo)
})

onMounted(() => {
  socket.on('media-message-progress-done', (message) => {
    mediaMessageProgressDoneUpdate.value = message
  })
})

const handleMediaMessageProgressDone = async (newMessage) => {
  if (newMessage.latestMessage.senderUserId === profileId.value && newMessage.chatRoomId === memoizedChatRoomId.value && chatRoomMessages.value.some(msg => msg?.messageId === newMessage.latestMessage.messageId)) {
    const messageIndex = mediaMessageProgress.value.findIndex(msg => msg?.latestMessage.messageId === newMessage.latestMessage.messageId)
    if (messageIndex !== -1) {
      const indexVideoMessage = chatRoomMessages.value.findIndex(msg => msg?.messageId === newMessage.latestMessage.messageId)
      if (indexVideoMessage !== -1) {
        const updatedDocument = {
          ...chatRoomMessages.value[indexVideoMessage].document,
          progress: 100,
          isProgressDone: newMessage.latestMessage.document.isProgressDone,
          isCancelled: newMessage.latestMessage.document.isCancelled,
          url: newMessage.latestMessage.document.url,
          // thumbnail: newMessage.thumbnail
        }
        if (newMessage.latestMessage.document?.poster) {
          updatedDocument.poster = newMessage.latestMessage.document?.poster
        }
        const updatedMessageItem = {
          ...chatRoomMessages.value[indexVideoMessage], // Salin properti messageItem yang lama
          document: updatedDocument, // Gantikan dengan objek document yang baru
        };
        chatRoomMessages.value[indexVideoMessage] = updatedMessageItem
        chatRoomMessages.value = [...chatRoomMessages.value]
        triggerRef(chatRoomMessages)
      }
      mediaMessageProgress.value = [...mediaMessageProgress.value.filter(msg => msg?.latestMessage.messageId !== newMessage.latestMessage.messageId)]
      triggerRef(mediaMessageProgress)
    }
  } else if (newMessage.latestMessage.senderUserId !== profileId.value && newMessage.chatRoomId === memoizedChatRoomId.value && !newMessage.latestMessage.document.isCancelled) {
    let newData = {}

    const { latestMessage } = newMessage

    newData = {
      ...latestMessage,
      id: latestMessage.messageId,
      chatRoomId: chatRoom.value?.chatRoomId,
      chatId: chatRoom.value?.chatId,
    }
    if (newData?.replyView) {
      newData.replyView = toRaw(newData.replyView)
    }

    const currentHeaderToday = toRaw(chatRoomMessages.value).find((msg) => {
      const itemDate = dayjs(Number(msg?.latestMessageTimestamp)).startOf('day')
      return formatDate(itemDate) === 'Today'
    })

    const isNeedHeaderTime = !currentHeaderToday

    if (
      !triggerScrollToMessageIdIsDone.value &&
      !loadingMainMessagesOnScrollBottom.value &&
      !showScrollDownButton.value &&
      !loadingMessagesPagination.value &&
      isStartIndex.value
    ) {
      if (isNeedHeaderTime) {
        const headerId = newMessage?.headerId ?? generateRandomId(15)
        chatRoomMessages.value = removeDuplicates(
          [
            {
              isHeader: true,
              id: headerId,
              messageId: headerId,
              senderUserId: newData.senderUserId,
              timeId: newMessage.timeId,
              chatId: newData.chatId,
              chatRoomId: newData.chatRoomId,
              latestMessageTimestamp: Number(newData.latestMessageTimestamp),
            },
            ...chatRoomMessages.value,
          ],
          'messageId',
          profileId.value
        ).sort((a, b) => sortByTimestamp(a, b, profileId.value))

        triggerRef(chatRoomMessages)
      }

      chatRoomMessages.value = removeDuplicates(
        [
          {
            ...newData,
            timeId: newMessage.timeId
          },
          ...chatRoomMessages.value,
        ],
        'messageId',
        profileId.value
      ).sort((a, b) => sortByTimestamp(a, b, profileId.value))

      if (toRaw(chatRoomMessages.value).length > ITEMS_PER_PAGE) {
        await nextTick()
        chatRoomMessages.value = chatRoomMessages.value.slice(0, -1)
      }
      triggerRef(chatRoomMessages)

      if (newData?.senderUserId === profileId.value && scroller.value) {
        scroller.value.$refs.scroller.$forceUpdate(true)
        scroller.value.scrollToItem(0)
      }
      mediaMessageProgress.value = [...mediaMessageProgress.value.filter(msg => msg?.latestMessage.messageId !== newMessage.latestMessage.messageId)]
      triggerRef(mediaMessageProgress)
    }
  }
}

const handleNewChats = (newMessage) => {
  const latestMessage = newMessage?.updatedChatLatestMessages?.find((msg) => msg.userId === profile.value?.data?.id)
  if (latestMessage && latestMessage?.senderUserId !== profile.value?.data?.id && latestMessage.document.isCancelled) {
    return
  }

  const chatCurrently = markRaw(memoizedChats.value)?.find(chat => chat?.chatId === newMessage?.chatId)
  // jika data ada di chats store
  // tinggal ubah datanya
  if (chatCurrently) {
    const newChatUserCurrently = {
      ...chatCurrently,
      latestMessage: [...newMessage.updatedChatLatestMessages],
      unreadCount: newMessage.unreadCount,
    }
    const removeChatUserCurrently = memoizedChats.value?.slice()?.filter(chat =>
      chat.chatId !== newMessage?.chatId
    )
    chats.value = [newChatUserCurrently,
      ...removeChatUserCurrently]
    chats.value = [...chats.value]
    triggerRef(chats)
  } else if (
    !chatCurrently && newMessage?.unreadCount?.[profileId.value] !== undefined
  ) {
    // jika belum ada di chats store
    // buat baru dan masukkan ke awal index
    const newUserChat = {
      ...newMessage,
      latestMessage: [...newMessage.updatedChatLatestMessages],
      userIds: [Object.entries(newMessage.unreadCount).find((k) => k[0] === profileId.value).find(id => id !== 0), Object.entries(newMessage.unreadCount).find((k) => k[0] !== profileId.value).find(id => id !== 0)]
    }
    delete newUserChat.eventType
    chats.value.unshift(newUserChat)
    chats.value = [...chats.value]
    triggerRef(chats)
  }
}

const handleNewSearchMessenger = (newMessage) => {
  const latestMessage = newMessage?.updatedChatLatestMessages?.find((msg) => msg.userId === profile.value?.data?.id)
  if (latestMessage && latestMessage?.senderUserId !== profile.value?.data?.id && latestMessage.document.isCancelled) {
    return
  }

  const chatCurrently = memoizedChatsCurrently.value?.find(chat => chat?.chatId === newMessage?.chatId)
  // jika data ada di chats store
  // tinggal ubah datanya
  if (chatCurrently) {
    const newChatUserCurrently = {
      ...chatCurrently,
      latestMessage: [...newMessage.updatedChatLatestMessages],
      unreadCount: newMessage.unreadCount,
    }
    const removeChatUserCurrently = memoizedChatsCurrently.value?.slice()?.filter(chat =>
      chat.chatId !== newMessage?.chatId
    )
    searchMessengerData.value = [newChatUserCurrently, ...removeChatUserCurrently]
    searchMessengerData.value = [...searchMessengerData.value]
    triggerRef(searchMessengerData)
  } else if (!chatCurrently && newMessage?.unreadCount?.[profileId.value] !== undefined) {
    if (searchValue.value.trim()) {
      if (newMessage?.recipientProfileId !== profileId.value) {
        return
      }

      const inSearch = newMessage?.username?.toLowerCase().includes(searchValue.value.toLowerCase()) ||
        (latestMessage && latestMessage?.textMessage?.toLowerCase().includes(searchValue.value.toLowerCase())) ||
        (latestMessage && latestMessage?.document?.caption?.toLowerCase().includes(searchValue.value.toLowerCase()))

      if (!inSearch) {
        return
      }
    }

    // jika belum ada di chats store
    // buat baru dan masukkan ke awal index
    const newUserChat = {
      ...newMessage,
      latestMessage: [...newMessage.updatedChatLatestMessages],
      userIds: [Object.entries(newMessage.unreadCount).find((k) => k[0] === profileId.value).find(id => id !== 0), Object.entries(newMessage.unreadCount).find((k) => k[0] !== profileId.value).find(id => id !== 0)]
    }
    delete newUserChat.eventType
    searchMessengerData.value.unshift(newUserChat)
    searchMessengerData.value = [...searchMessengerData.value]
    triggerRef(searchMessengerData)
  }
}

watch(mediaMessageProgressDoneUpdate, (newMessage) => {
  handleMediaMessageProgressDone(newMessage)
  handleNewChats(newMessage)
  handleNewSearchMessenger(newMessage)
})

onMounted(() => {
  socket.on('typing-stop', (data) => {
    typingStopSocketUpdate.value = {
      ...data,
      key: typingStopSocketUpdate.value.key + 1
    }
  })
})

onBeforeMount(() => {
  if (profileId.value) {
    socket.emit('userOnline', profileId.value)
  }
})

onBeforeMount(() => {
  socket.on('userOnline', (id) => {
    userOnlineSocketUpdate.value.id = id
    userOnlineSocketUpdate.value.key = + 1
    triggerRef(userOnlineSocketUpdate)
  })
  socket.on('userOffline', (data) => {
    userOfflineSocketUpdate.value = data
  })
})

const notifyOnline = () => {
  if (socket?.connected && profileId.value) {
    socket.emit('userOnline', profileId.value)
  }
}

onMounted(() => {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      notifyOnline()
    }
  })

  window.addEventListener('focus', notifyOnline)
  window.addEventListener('online', notifyOnline)
})

onBeforeUnmount(() => {
  window.removeEventListener('focus', notifyOnline)
  window.removeEventListener('online', notifyOnline)
})

watch(typingStartSocketUpdate, (data) => {
  if (data?.recipientId === profile.value?.data.id) {
    handleUpdateUsersTyping(data, 'start')
  }
})

watch(typingStopSocketUpdate, (data) => {
  if (data?.recipientId === profile.value?.data.id) {
    handleUpdateUsersTyping(data, 'stop')
  }
})

watch(userOfflineSocketUpdate, (data) => {
  if (data?.id) {
    const chatUserIndex = markRaw(memoizedChats.value)?.slice()?.findIndex(chat => chat?.userIds.find(recipientId => recipientId === data.id))
    if (chatUserIndex !== -1) {
      chats.value[chatUserIndex] = {
        ...chats.value[chatUserIndex],
        lastSeenTime: data.lastSeenTime
      }
      chats.value = markRaw([...chats.value]) // gunakan markRaw karena hanya replace array
      triggerRef(chats)
    }

    const searchMessageUserIndex = markRaw(searchMessengerData.value)?.slice()?.findIndex(chat => chat?.userIds.find(recipientId => recipientId === data.id))
    if (searchMessageUserIndex !== -1) {
      searchMessengerData.value[searchMessageUserIndex] = {
        ...searchMessengerData.value[searchMessageUserIndex],
        lastSeenTime: data.lastSeenTime
      }
      searchMessengerData.value = markRaw([...searchMessengerData.value]) // gunakan markRaw karena hanya replace array
      triggerRef(searchMessengerData)
    }
  }
})

watch(userOnlineSocketUpdate, (data) => {
  if (data.id !== profileId.value) {
    const chatUserIndex = markRaw(memoizedChats.value)?.slice()?.findIndex(chat => chat?.userIds.find(recipientId => recipientId === data.id))
    if (chatUserIndex !== -1) {
      chats.value[chatUserIndex] = {
        ...chats.value[chatUserIndex],
        lastSeenTime: 'online'
      }
      chats.value = markRaw([...chats.value]) // gunakan markRaw karena hanya replace array
      triggerRef(chats)
    }

    const searchMessageUserIndex = markRaw(searchMessengerData.value)?.slice()?.findIndex(chat => chat?.userIds.find(recipientId => recipientId === data.id))
    if (searchMessageUserIndex !== -1) {
      searchMessengerData.value[searchMessageUserIndex] = {
        ...searchMessengerData.value[searchMessageUserIndex],
        lastSeenTime: 'online'
      }
      searchMessengerData.value = markRaw([...searchMessengerData.value]) // gunakan markRaw karena hanya replace array
      triggerRef(searchMessengerData)
    }
  }
})

onUnmounted(() => {
  usersTyping.value = []
  window.removeEventListener('resize', handleDeviceDetector)
  mediaMessageProgress.value = []
})
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-3">
    <ProfileLayoutWrapper />
    <ChatLayout />
    <ChatRoomLayout />
  </div>
</template>
