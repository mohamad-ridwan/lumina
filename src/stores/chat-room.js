import { fetchChatRoom } from '@/services/api/chat-room'
import { clientUrl } from '@/services/apiBaseUrl'
import { socket } from '@/services/socket/socket'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useChatRoomStore = defineStore('chat-room', () => {
  const chatRoom = ref({})
  // worker progress
  const chatRoomWorker = ref(null)
  const checkChatRoomWorker = ref(null)
  const totalDataStreamsChatRoom = ref(null)
  const isChatRoomStreamsDone = ref(false)

  function setChatRoom(chatRoomData) {
    chatRoom.value = chatRoomData
  }

  function handleReadMessage(messageId) {
    let chatDataCurrently = chatRoom.value.data
    const currentMessageIndex = chatDataCurrently.findIndex((msg) => msg.messageId === messageId)
    if (currentMessageIndex === -1) {
      return
    }
    chatDataCurrently[currentMessageIndex].status = 'READ'
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

    chatRoom.value.data = []

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

    const chatRoomSource = new EventSource(
      `${clientUrl}/chat-room/stream?chatId=${itemCurrently?.chatId}&chatRoomId=${itemCurrently?.chatRoomId}`,
    )

    chatRoomSource.onmessage = (event) => {
      const message = JSON.parse(event.data)
      if (message?.messageId) {
        Object.assign(chatRoom.value, {
          chatId: item.chatId,
          chatRoomId: item.chatRoomId,
          userIds: item.userIds.slice(),
        })
        chatRoom.value.data.push({ ...message, id: message?.messageId })
      }
    }

    chatRoomSource.addEventListener('done', () => {
      chatRoomSource.close()
    })

    chatRoomSource.addEventListener('error', (e) => {
      console.error('Streaming error:', e)
      chatRoomSource.close()
    })
  }

  return {
    chatRoom,
    chatRoomWorker,
    checkChatRoomWorker,
    totalDataStreamsChatRoom,
    isChatRoomStreamsDone,
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
