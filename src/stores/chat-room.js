import { fetchChatRoom } from '@/services/api/chat-room'
import { socket } from '@/services/socket/socket'
import { defineStore } from 'pinia'
import { markRaw, ref, toRaw } from 'vue'

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

  async function handleClickUser(userId, item) {
    // get chat room
    if (chatRoom.value?.chatId === item?.chatId) {
      return
    }
    // stop worker first
    if (chatRoomWorker.value) {
      handleStopChatRoomWorker()
    }
    if (checkChatRoomWorker.value) {
      handleStopCheckChatRoomWorker()
    }

    // set worker to use in streams
    handleSetChatRoomWorker()

    // reset chat room data
    chatRoom.value.data = []
    setTotalDataStreamsChatRoom(null)

    // leave room previous
    if (chatRoom.value?.chatId) {
      socket.emit('leaveRoom', {
        chatRoomId: chatRoom.value?.chatRoomId,
        chatId: chatRoom.value?.chatId,
        userId: userId,
      })
    }

    socket.emit('joinRoom', {
      chatRoomId: item?.chatRoomId,
      chatId: item?.chatId,
      userId: userId,
    })

    fetchChatRoom(
      { userIds: item.userIds, mainUserId: userId },
      chatRoomWorker.value,
      // response callback
      (res, isDone, totalData) => {
        if (totalData !== null) {
          setTotalDataStreamsChatRoom(totalData)
        }

        if (res?.length > 0 && !isDone) {
          if (!checkChatRoomWorker.value) {
            // start the worker
            handleSetCheckChatRoomWorker()
          }

          checkChatRoomWorker.value.postMessage({
            messages: toRaw(chatRoom.value.data),
            streams: res,
          })

          // listen to check chatRoom data currently
          checkChatRoomWorker.value.onmessage = (event) => {
            const { messages } = event.data
            Object.assign(chatRoom.value, {
              chatId: item.chatId,
              chatRoomId: item.chatRoomId,
              userIds: item.userIds.slice(),
              data: markRaw(messages),
            })

            if (
              event.data.messages.length === totalDataStreamsChatRoom.value ||
              totalDataStreamsChatRoom.value
            ) {
              handleChatRoomStreamsDone()
              handleStopChatRoomWorker()
              handleStopCheckChatRoomWorker()
            }
          }
        } else if (res?.length === 0 || !res) {
          handleChatRoomStreamsDone()
          if (checkChatRoomWorker.value) {
            handleStopCheckChatRoomWorker()
          }
          handleStopChatRoomWorker()
        }
      },
      // err callback
      () => {},
    )
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
