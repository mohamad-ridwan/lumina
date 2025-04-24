import { fetchChatRoom } from '@/services/api/chat-room'
import { clientUrl } from '@/services/apiBaseUrl'
import { socket } from '@/services/socket/socket'
import { defineStore } from 'pinia'
import { markRaw, nextTick, ref, shallowRef, toRaw } from 'vue'
import AddNewMessageWorker from '@/services/workers/add-new-message-worker.js?worker'
import GetChatRoomWorker from '@/services/workers/get-chat-room-worker.js?worker'
import StreamsChatRoomWorker from '@/services/workers/streams-chat-room-worker.js?worker'
import { general } from '@/helpers/general'

export const ITEMS_PER_PAGE = 150
export const SCROLL_THRESHOLD = 200

const { createNewMessages, sortByTimestamp, removeDuplicates } = general

export const useChatRoomStore = defineStore('chat-room', () => {
  const chatRoom = ref({})
  const chatRoomMessages = shallowRef([])
  const loadingMessages = shallowRef(true)
  const headerRefs = ref({})
  const scroller = ref(null)
  const showScrollDownButton = ref(false)
  const getChatRoomWorker = ref(null)
  const addNewMessageWorker = ref(null)
  const chatRoomEventSource = ref(null)
  const streamsChatRoomWorker = ref(null)
  const loadingMessagesPagination = ref(false)
  const bufferNewMessages = ref([])
  const isStartIndex = ref(true)
  const bufferAddNewMessageEventSource = ref([])
  const totalAddNewMessageEventSource = ref([])
  const addNewMessageEventSource = ref(null)
  const loadingAddNewMessageEventSource = ref(false)
  const keyAddNewMessageEventSource = ref(0)

  function setChatRoom(chatRoomData) {
    chatRoom.value = chatRoomData
  }

  function setChatRoomMessages(value) {
    chatRoomMessages.value = markRaw(value)
  }

  function resetAddNewMessageEventSource() {
    if (addNewMessageEventSource.value) {
      addNewMessageEventSource.value.close()
      addNewMessageEventSource.value = null
      keyAddNewMessageEventSource.value = 0
      bufferAddNewMessageEventSource.value = []
    }
  }

  function setAddNewMessageEventSource() {
    addNewMessageEventSource.value = new EventSource(
      `${clientUrl}/chat-room/stream?chatId=${chatRoom.value?.chatId}&chatRoomId=${chatRoom.value?.chatRoomId}`,
    )
  }

  async function handleAddNewMessageOnEventSource(newData, profileId) {
    if (
      showScrollDownButton.value &&
      newData.senderUserId === profileId &&
      !loadingAddNewMessageEventSource.value
    ) {
      loadingAddNewMessageEventSource.value = true

      isStartIndex.value = true
      resetAddNewMessageEventSource()
      setAddNewMessageEventSource()

      addNewMessageEventSource.value.onmessage = async (event) => {
        const message = JSON.parse(event.data)
        if (message?.length) {
          totalAddNewMessageEventSource.value.push(...message)

          let newMessages = []

          if (keyAddNewMessageEventSource.value === 0) {
            newMessages = [...totalAddNewMessageEventSource.value, ...chatRoomMessages.value]
          } else {
            newMessages = [...chatRoomMessages.value, ...totalAddNewMessageEventSource.value]
          }

          if (toRaw(bufferAddNewMessageEventSource.value).length > 0) {
            newMessages.push(...bufferAddNewMessageEventSource.value)
          }

          chatRoomMessages.value = markRaw(createNewMessages(newMessages))

          if (scroller.value.$el.scrollTop !== 0 && keyAddNewMessageEventSource.value === 0) {
            scroller.value.$el.scrollTop = 0
          }

          keyAddNewMessageEventSource.value += 1

          if (totalAddNewMessageEventSource.value.length >= ITEMS_PER_PAGE) {
            resetAddNewMessageEventSource()
            keyAddNewMessageEventSource.value = 0
            loadingAddNewMessageEventSource.value = false
            totalAddNewMessageEventSource.value = []
          }

          bufferAddNewMessageEventSource.value = []
        }
      }

      addNewMessageEventSource.value.addEventListener('done', (event) => {
        resetAddNewMessageEventSource()
        loadingAddNewMessageEventSource.value = false
        keyAddNewMessageEventSource.value = 0
        totalAddNewMessageEventSource.value = []
      })
      addNewMessageEventSource.value.addEventListener('error', (event) => {
        resetAddNewMessageEventSource()
        loadingAddNewMessageEventSource.value = false
        keyAddNewMessageEventSource.value = 0
        totalAddNewMessageEventSource.value = []
      })
    } else if (
      showScrollDownButton.value &&
      newData.senderUserId === profileId &&
      loadingAddNewMessageEventSource.value
    ) {
      bufferAddNewMessageEventSource.value.unshift(newData)
    }
  }

  async function handleAddNewMessage(newMessage, profileId) {
    let newData = {}

    if (newMessage?.isHeader) {
      newData = {
        ...newMessage,
        id: newMessage.messageId,
        chatRoomId: chatRoom.value?.chatRoomId,
        chatId: chatRoom.value?.chatId,
      }
      delete newData.eventType

      addNewMessageWorker.value.postMessage({
        chatRoomId: chatRoom.value?.chatRoomId,
        chatId: chatRoom.value?.chatId,
        item: newData,
      })

      handleAddNewMessageOnEventSource(newData, profileId)

      if (!showScrollDownButton.value && !loadingMessagesPagination.value && isStartIndex.value) {
        chatRoomMessages.value = markRaw(
          removeDuplicates([newData, ...chatRoomMessages.value], 'messageId').sort(sortByTimestamp),
        )

        if (toRaw(chatRoomMessages.value).length > ITEMS_PER_PAGE) {
          await nextTick()
          chatRoomMessages.value = markRaw(chatRoomMessages.value.slice(0, -1))
        }
      }

      if (!showScrollDownButton.value && loadingMessagesPagination.value) {
        bufferNewMessages.value.unshift(newData)
      }

      return
    }

    newData = {
      ...newMessage.latestMessage,
      id: newMessage.latestMessage.messageId,
      chatRoomId: chatRoom.value?.chatRoomId,
      chatId: chatRoom.value?.chatId,
    }

    addNewMessageWorker.value.postMessage({
      chatRoomId: chatRoom.value?.chatRoomId,
      chatId: chatRoom.value?.chatId,
      item: newData,
    })

    handleAddNewMessageOnEventSource(newData, profileId)

    if (!showScrollDownButton.value && !loadingMessagesPagination.value && isStartIndex.value) {
      chatRoomMessages.value = markRaw(
        removeDuplicates(
          [
            {
              ...newData,
            },
            ...chatRoomMessages.value,
          ],
          'messageId',
        ).sort(sortByTimestamp),
      )

      if (toRaw(chatRoomMessages.value).length > ITEMS_PER_PAGE) {
        await nextTick()
        chatRoomMessages.value = markRaw(chatRoomMessages.value.slice(0, -1))
      }
    }

    if (!showScrollDownButton.value && loadingMessagesPagination.value) {
      bufferNewMessages.value.unshift(newData)
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

  function handleSetAddNewMessageWorker() {
    addNewMessageWorker.value = new AddNewMessageWorker()
  }

  function handleStopAddNewMessageWorker() {
    addNewMessageWorker.value.terminate()
    addNewMessageWorker.value = null
  }

  function resetChatRoomEventSource() {
    chatRoomEventSource.value.close()
    chatRoomEventSource.value = null
  }

  function handleSetGetChatRoomWorker() {
    getChatRoomWorker.value = new GetChatRoomWorker()
  }

  function handleStopGetChatRoomWorker() {
    if (getChatRoomWorker.value) {
      getChatRoomWorker.value.terminate()
      getChatRoomWorker.value = null
    }
  }

  function handleSetStreamsChatRoomWorker() {
    streamsChatRoomWorker.value = new StreamsChatRoomWorker()
  }

  function handleStopStreamsChatRoomWorker() {
    if (streamsChatRoomWorker.value) {
      streamsChatRoomWorker.value.terminate()
      streamsChatRoomWorker.value = null
    }
  }

  async function handleClickUser(userId, item, isNewChatRoom) {
    if (chatRoom.value?.chatId && chatRoom.value?.chatId === item?.chatId) {
      return
    }
    loadingMessages.value = true
    headerRefs.value = {}

    handleStopGetChatRoomWorker()
    handleSetGetChatRoomWorker()

    handleStopStreamsChatRoomWorker()
    handleSetStreamsChatRoomWorker()

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

    let loadingGetChatRoom = true
    let bufferMessages = []
    let isEmptyChatRoomDB = null
    let totalMessagesLength = 0
    let totalStreamsIndexedDB = 0
    let isStreamsDone = false

    Object.assign(chatRoom.value, {
      chatId: itemCurrently.chatId,
      chatRoomId: itemCurrently.chatRoomId,
      userIds: itemCurrently.userIds.slice(),
    })

    chatRoomEventSource.value = new EventSource(
      `${clientUrl}/chat-room/stream?chatId=${itemCurrently?.chatId}&chatRoomId=${itemCurrently?.chatRoomId}`,
    )

    chatRoomEventSource.value.onmessage = async (event) => {
      const message = JSON.parse(event.data)
      if (message?.length) {
        if (chatRoomMessages.value.length === 0 && getChatRoomWorker.value) {
          getChatRoomWorker.value.postMessage(itemCurrently.chatRoomId)
        }

        if (getChatRoomWorker.value) {
          getChatRoomWorker.value.onmessage = (event) => {
            if (event.data.length === 0) {
              isEmptyChatRoomDB = true
            } else {
              chatRoomMessages.value = markRaw(
                removeDuplicates([...chatRoomMessages.value, ...event.data], 'messageId'),
              )
            }
            loadingGetChatRoom = false
            nextTick(() => {
              handleStopGetChatRoomWorker()
            })
            loadingMessages.value = false
          }
        }

        if (loadingGetChatRoom) {
          // save current load streams to buffer first
          if (bufferMessages.length < ITEMS_PER_PAGE) {
            bufferMessages.push(...message)
          }
        } else if (!loadingGetChatRoom && isEmptyChatRoomDB) {
          chatRoomMessages.value = markRaw(
            createNewMessages([...chatRoomMessages.value, ...bufferMessages]),
          )
        } else if (!loadingGetChatRoom) {
          if (toRaw(chatRoomMessages.value).length < ITEMS_PER_PAGE) {
            chatRoomMessages.value = markRaw(
              createNewMessages([...chatRoomMessages.value, ...message]),
            )
          }
          bufferMessages = []
        }

        streamsChatRoomWorker.value.postMessage({
          chatRoomId: itemCurrently?.chatRoomId,
          chatId: itemCurrently?.chatId,
          streams: message,
        })

        streamsChatRoomWorker.value.onmessage = (event) => {
          totalStreamsIndexedDB += event.data

          if (isStreamsDone && totalStreamsIndexedDB === totalMessagesLength) {
            setTimeout(() => {
              handleStopStreamsChatRoomWorker()
            }, 1000)
          }
        }

        totalMessagesLength += message.length
      } else {
        resetChatRoomEventSource()
        handleStopStreamsChatRoomWorker()
        handleStopGetChatRoomWorker()
      }
    }

    chatRoomEventSource.value.addEventListener('done', (event) => {
      const message = JSON.parse(event.data)
      if (message?.length === 0) {
        handleStopStreamsChatRoomWorker()
      }
      resetChatRoomEventSource()
      handleStopGetChatRoomWorker()
      // handleStopStreamsChatRoomWorker()
      loadingMessages.value = false
      bufferMessages = []
      isStreamsDone = true
    })

    chatRoomEventSource.value.addEventListener('error', (e) => {
      console.error('Streaming error:', e)
      resetChatRoomEventSource()
      handleStopGetChatRoomWorker()
      handleStopStreamsChatRoomWorker()
      loadingMessages.value = false
      bufferMessages = []
      isStreamsDone = true
    })
  }

  return {
    chatRoom,
    addNewMessageWorker,
    chatRoomEventSource,
    chatRoomMessages,
    loadingMessages,
    headerRefs,
    scroller,
    showScrollDownButton,
    loadingMessagesPagination,
    isStartIndex,
    bufferNewMessages,
    resetAddNewMessageEventSource,
    handleStopStreamsChatRoomWorker,
    setChatRoomMessages,
    handleAddNewMessage,
    resetChatRoomEventSource,
    handleClickUser,
    handleStopAddNewMessageWorker,
    handleSetAddNewMessageWorker,
    setChatRoom,
    handleReadMessage,
    handleStopGetChatRoomWorker,
    loadingAddNewMessageEventSource,
  }
})
