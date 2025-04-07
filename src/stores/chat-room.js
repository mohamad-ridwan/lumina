import { fetchChatRoom } from '@/services/api/chat-room'
import { clientUrl } from '@/services/apiBaseUrl'
import { socket } from '@/services/socket/socket'
import { defineStore } from 'pinia'
import { markRaw, ref } from 'vue'

export const useChatRoomStore = defineStore('chat-room', () => {
  const chatRoom = ref({})
  const chatRoomMessages = ref([])
  // worker progress
  const chatRoomWorker = ref(null)
  const checkChatRoomWorker = ref(null)
  const totalDataStreamsChatRoom = ref(null)
  const isChatRoomStreamsDone = ref(false)
  const chatRoomEventSource = ref(null)

  function setChatRoom(chatRoomData) {
    chatRoom.value = chatRoomData
  }

  function handleAddNewMessage(newMessage) {
    chatRoomMessages.value = markRaw([
      markRaw({ ...newMessage.latestMessage, id: newMessage.latestMessage.messageId }),
      ...markRaw(chatRoomMessages.value),
    ])
  }

  function handleReadMessage(messageId) {
    let chatDataCurrently = markRaw(chatRoomMessages.value)
    const currentMessageIndex = chatDataCurrently.findIndex((msg) => msg.messageId === messageId)
    if (currentMessageIndex === -1) {
      return
    }
    chatDataCurrently[currentMessageIndex].status = 'READ'
    chatRoomMessages.value = markRaw(chatDataCurrently)
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

    let itemCurrently = {}
    if (isNewChatRoom) {
      const chatCurrently = await fetchChatRoom({
        userIds: item.userIds,
        mainUserId: userId,
      })
      if (!chatCurrently?.latestMessage) {
        return
      }
      itemCurrently = chatCurrently
    } else {
      itemCurrently = item
    }

    chatRoomMessages.value = []

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
      chatId: item.chatId,
      chatRoomId: item.chatRoomId,
      userIds: item.userIds.slice(),
    })

    chatRoomEventSource.value = new EventSource(
      `${clientUrl}/chat-room/stream?chatId=${itemCurrently?.chatId}&chatRoomId=${itemCurrently?.chatRoomId}`,
    )

    chatRoomEventSource.value.onmessage = (event) => {
      const message = JSON.parse(event.data)
      if (message?.length) {
        chatRoomMessages.value = markRaw([...markRaw(chatRoomMessages.value), ...markRaw(message)])
      }
    }

    chatRoomEventSource.value.addEventListener('done', () => {
      resetChatRoomEventSource()
    })

    chatRoomEventSource.value.addEventListener('error', (e) => {
      console.error('Streaming error:', e)
      resetChatRoomEventSource()
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
