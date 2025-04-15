import { fetchChatRoom } from '@/services/api/chat-room'
import { clientUrl } from '@/services/apiBaseUrl'
import { socket } from '@/services/socket/socket'
import { defineStore } from 'pinia'
import { markRaw, ref, shallowRef, toRaw } from 'vue'

export const useChatRoomStore = defineStore('chat-room', () => {
  const chatRoom = ref({})
  const chatRoomMessages = shallowRef([])
  const loadingMessages = shallowRef(true)
  // worker progress
  const chatRoomWorker = ref(null)
  const checkChatRoomWorker = ref(null)
  const totalDataStreamsChatRoom = ref(null)
  const isChatRoomStreamsDone = ref(false)
  const chatRoomEventSource = ref(null)

  function setChatRoom(chatRoomData) {
    chatRoom.value = chatRoomData
  }

  function setChatRoomMessages(value) {
    chatRoomMessages.value = value
  }

  function handleAddNewMessage(newMessage) {
    if (newMessage?.isHeader) {
      const newData = {
        ...newMessage,
        id: newMessage.messageId,
      }
      delete newData.eventType
      // chatRoomMessages.value = markRaw([newData, ...markRaw(chatRoomMessages.value)])
      chatRoomMessages.value = markRaw([newData, ...markRaw(chatRoomMessages.value)])
    } else {
      // chatRoomMessages.value = markRaw([
      //   {
      //     ...newMessage.latestMessage,
      //     id: newMessage.latestMessage.messageId,
      //   },
      //   ...markRaw(chatRoomMessages.value),
      // ])

      chatRoomMessages.value = markRaw([
        {
          ...newMessage.latestMessage,
          id: newMessage.latestMessage.messageId,
        },
        ...markRaw(chatRoomMessages.value),
      ])
    }
  }

  function handleReadMessage(messageId) {
    // let chatDataCurrently = chatRoomMessages.value
    const currentMessageIndex = toRaw(chatRoomMessages.value)?.findIndex(
      (msg) => msg.messageId === messageId,
    )
    if (currentMessageIndex === -1) {
      return
    }
    chatRoomMessages.value[currentMessageIndex].status = 'READ'
    // triggerRef(chatRoomMessages)
    // chatRoomMessages.value = chatDataCurrently
  }

  function handleSetChatRoomWorker() {
    chatRoomWorker.value = new Worker(
      new URL('/src/services/workers/api-chat-room-worker.js', import.meta.url),
    )
  }

  function handleStopChatRoomWorker() {
    chatRoomWorker.value.terminate()
    chatRoomWorker.value = null
  }

  function setTotalDataStreamsChatRoom(totalData) {
    totalDataStreamsChatRoom.value = totalData
  }

  function handleSetCheckChatRoomWorker() {
    checkChatRoomWorker.value = new Worker(
      new URL('/src/services/workers/check-chat-room-worker.js', import.meta.url),
    )
  }

  function handleStopCheckChatRoomWorker() {
    checkChatRoomWorker.value.terminate()
    checkChatRoomWorker.value = null
  }

  function handleChatRoomStreamsDone() {
    isChatRoomStreamsDone.value = true
  }

  function resetChatRoomEventSource() {
    chatRoomEventSource.value.close()
    chatRoomEventSource.value = null
  }

  async function handleClickUser(userId, item, isNewChatRoom) {
    if (chatRoom.value?.chatId && chatRoom.value?.chatId === item?.chatId) {
      return
    }
    loadingMessages.value = true

    let itemCurrently = {}
    if (isNewChatRoom) {
      const chatCurrently = await fetchChatRoom({
        userIds: item.userIds,
        mainUserId: userId,
      })
      itemCurrently = chatCurrently
    } else {
      itemCurrently = item
    }

    setChatRoomMessages([])

    if (chatRoom.value?.chatId) {
      socket.emit('leaveRoom', {
        chatRoomId: chatRoom.value?.chatRoomId,
        chatId: chatRoom.value?.chatId,
        userId: userId,
      })
    }

    socket.emit('joinRoom', {
      chatRoomId: itemCurrently?.chatRoomId,
      chatId: itemCurrently?.chatId,
      userId: userId,
    })

    if (chatRoomEventSource.value) {
      resetChatRoomEventSource()
    }

    Object.assign(chatRoom.value, {
      chatId: itemCurrently.chatId,
      chatRoomId: itemCurrently.chatRoomId,
      userIds: itemCurrently.userIds.slice(),
    })

    chatRoomEventSource.value = new EventSource(
      `${clientUrl}/chat-room/stream?chatId=${itemCurrently?.chatId}&chatRoomId=${itemCurrently?.chatRoomId}`,
    )

    chatRoomEventSource.value.onmessage = (event) => {
      const message = JSON.parse(event.data)
      if (message?.length) {
        // setChatRoomMessages(markRaw([...markRaw(chatRoomMessages.value), ...message]))
        setChatRoomMessages(markRaw([...markRaw(chatRoomMessages.value), ...message]))
      }
      loadingMessages.value = false
    }

    chatRoomEventSource.value.addEventListener('done', () => {
      resetChatRoomEventSource()
      loadingMessages.value = false
    })

    chatRoomEventSource.value.addEventListener('error', (e) => {
      console.error('Streaming error:', e)
      resetChatRoomEventSource()
      loadingMessages.value = false
    })
  }

  return {
    chatRoom,
    chatRoomWorker,
    checkChatRoomWorker,
    totalDataStreamsChatRoom,
    isChatRoomStreamsDone,
    chatRoomEventSource,
    chatRoomMessages,
    loadingMessages,
    setChatRoomMessages,
    handleAddNewMessage,
    resetChatRoomEventSource,
    handleClickUser,
    handleChatRoomStreamsDone,
    handleSetCheckChatRoomWorker,
    handleStopCheckChatRoomWorker,
    setTotalDataStreamsChatRoom,
    handleStopChatRoomWorker,
    handleSetChatRoomWorker,
    setChatRoom,
    handleReadMessage,
  }
})
