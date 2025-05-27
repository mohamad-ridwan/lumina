import {
  fetchChatRoom,
  fetchMessagesAround,
  fetchMessagesPagination,
} from '@/services/api/chat-room'
import { general } from '@/helpers/general'
import { clientUrl } from '@/services/apiBaseUrl'
import { socket } from '@/services/socket/socket'
import { defineStore } from 'pinia'
import { nextTick, ref, shallowRef, toRaw, triggerRef } from 'vue'
import AddNewMessageWorker from '@/services/workers/add-new-message-worker.js?worker'
import GetChatRoomWorker from '@/services/workers/get-chat-room-worker.js?worker'
import StreamsChatRoomWorker from '@/services/workers/streams-chat-room-worker.js?worker'
import MainMessagesWorker from '@/services/workers/main-message-workers.js?worker'
import { ITEMS_PER_PAGE } from '@/utils/pagination'
import { chatRoomDB } from '@/services/indexedDB/chat-room-db'
import { useToast } from 'primevue'
import { constant } from '@/utils/constant'
import dayjs from 'dayjs'
import 'dayjs/locale/id'
import isToday from 'dayjs/plugin/isToday'
import isYesterday from 'dayjs/plugin/isYesterday'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import weekday from 'dayjs/plugin/weekday'
import { generateRandomId } from '@/helpers/generateRandomId'

dayjs.extend(isToday)
dayjs.extend(isYesterday)
dayjs.extend(weekOfYear)
dayjs.extend(weekday)

export const useChatRoomStore = defineStore('chat-room', () => {
  const chatRoom = ref({})
  const chatRoomMessages = shallowRef([])
  const loadingMessages = shallowRef(true)
  const headerRefs = shallowRef({})
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
  const getMainMessagesWorkerOnScrollBottom = ref(null)
  const loadingMainMessagesOnScrollBottom = ref(false)
  const bufferNewMessagesOnScrollBottom = ref([])
  const mainMessagesEventSource = ref(null)
  const bufferMainMessagesEventSource = ref([])
  const mainMessagesWorker = ref(null)
  const totalMainMessagesEventSource = ref(0)
  const loadingMainMessagesEventSource = ref(false)
  const totalStreamsMainMessagesWorker = ref(0)
  const paginationMessagesComparisonWorker = ref(null)
  const replyMessageData = ref(null)
  const activeMessageMenu = ref(null)
  const activeSelectReactions = ref(null)
  const goingScrollToMessageId = ref(null)
  const loadingScrollToGoMessageId = ref(false)
  const triggerScrollToMessageIdIsDone = ref(false)
  const confirmDeleteMessage = ref(null)
  const updateStreamsToIndexedDB = shallowRef(null)
  const totalStreamsLength = shallowRef(0)
  const totalStreamsChatRoomWorkerDones = shallowRef(0)
  const attachments = ref(null)
  const formMessage = ref({
    textMessage: '',
  })
  const stayScrollCurrently = shallowRef(null)
  const proccessSubmitAttachmentData = ref(null)
  const activeMediaData = ref(null)
  const usersTyping = shallowRef([])
  const lightboxEl = ref(null)
  const galleryInstance = ref(null)

  const { createNewMessages, sortByTimestamp, removeDuplicates, messageMatching, formatDate } =
    general
  const { deleteChatRoomById } = chatRoomDB

  const toast = useToast()

  const { globalErrMessageAPI } = constant

  const handleUpdateUsersTyping = async (data, actionType) => {
    if (actionType === 'start') {
      // Buat Set dari kombinasi senderId + recipientId (stringify)
      const usersTypingCurrentlySet = new Set(usersTyping.value.map((item) => JSON.stringify(item)))

      // Data baru (juga stringify)
      const newItemStr = JSON.stringify(data)

      // Tambahkan kalau belum ada
      if (!usersTypingCurrentlySet.has(newItemStr)) {
        usersTyping.value = [...usersTyping.value, data]
      }
    }

    if (actionType === 'stop') {
      usersTyping.value = usersTyping.value.filter((item) => {
        return !(item.senderId === data.senderId && item.recipientId === data.recipientId)
      })
    }
  }

  const handleResetActiveMediaData = () => {
    activeMediaData.value = null
  }

  const handleSetActiveMediaData = (data) => {
    activeMediaData.value = data
  }

  const handleSetAttachment = ({ type, file }) => {
    let newAttachment = null
    if (type === 'image') {
      newAttachment = {
        type,
        file,
      }
    }

    attachments.value = newAttachment
  }

  const handleResetAttachment = () => {
    attachments.value = null
  }

  const handleResetConfirmDeleteMessage = () => {
    confirmDeleteMessage.value = null
  }

  const handleSetConfirmDeleteMessage = (value) => {
    confirmDeleteMessage.value = value
  }

  const handleResetActiveSelectReactions = () => {
    activeSelectReactions.value = null
  }

  const handleSetActiveSelectReactions = (type, messageId, profileId) => {
    activeSelectReactions.value = {
      type,
      messageId,
      profileId,
    }
  }

  const handleResetGoingScrollToMessageId = () => {
    setTimeout(() => {
      goingScrollToMessageId.value = null
    }, 500)
  }

  const resetTriggerScrollToMessageIdIsDone = () => {
    setTimeout(() => {
      triggerScrollToMessageIdIsDone.value = false
    }, 500)
  }

  const resetTriggerGoToMessageIndex = (messageIndex) => {
    setTimeout(() => {
      scroller.value.scrollToItem(messageIndex)
    }, 0)
  }

  const handleScrollToGoMessage = async (messageId, profileId) => {
    handleResetActiveSelectReactions()
    resetActiveMessageMenu()
    const messageIndex = toRaw(chatRoomMessages.value).findIndex(
      (msg) => msg?.messageId === messageId,
    )
    if (messageIndex !== -1) {
      await nextTick()
      await nextTick()
      triggerRef(chatRoomMessages)
      scroller.value.$refs.scroller.$forceUpdate(true)
      scroller.value.scrollToItem(messageIndex - 1)
      clearTimeout(handleResetGoingScrollToMessageId)
      goingScrollToMessageId.value = messageId
      handleResetGoingScrollToMessageId()
    } else {
      loadingScrollToGoMessageId.value = true
      const resultMessageAround = await fetchMessagesAround(
        chatRoom.value?.chatRoomId,
        messageId,
        profileId,
      )
      if (
        (resultMessageAround?.isErr && resultMessageAround?.status !== 404) ||
        resultMessageAround?.total === 0
      ) {
        toast.add({ severity: 'error', summary: globalErrMessageAPI, life: 3000 })
      } else {
        clearTimeout(resetTriggerScrollToMessageIdIsDone)
        triggerScrollToMessageIdIsDone.value = true
        chatRoomMessages.value = resultMessageAround.messages.map((newMsg) => ({
          id: newMsg.messageId,
          chatRoomId: chatRoom.value?.chatRoomId,
          chatId: chatRoom.value?.chatId,
          ...newMsg,
        }))
        // biarkan button to bottom message active
        // supaya pesan baru otomatis tidak update ke state
        await nextTick()
        scroller.value.scrollToItem(5)
        await nextTick()
        await nextTick()
        triggerRef(chatRoomMessages)
        scroller.value.$refs.scroller.$forceUpdate(true)
        const messageIndex = toRaw(chatRoomMessages.value)
          .reverse()
          .findIndex((msg) => msg?.messageId === messageId)
        if (messageIndex !== -1) {
          clearTimeout(resetTriggerGoToMessageIndex)
          scroller.value.scrollToItem(messageIndex)
          resetTriggerGoToMessageIndex(messageIndex - 1)
          await nextTick()
          await nextTick()
          triggerRef(chatRoomMessages)
          scroller.value.$refs.scroller.$forceUpdate(true)
          clearTimeout(handleResetGoingScrollToMessageId)
          goingScrollToMessageId.value = messageId
          handleResetGoingScrollToMessageId()
        }
      }
      loadingScrollToGoMessageId.value = false
      resetTriggerScrollToMessageIdIsDone()
    }
  }

  const resetActiveMessageMenu = () => {
    activeMessageMenu.value = null
  }

  const handleActiveMessageMenu = (messageId) => {
    activeMessageMenu.value = messageId
  }

  const resetReplyMessageData = () => {
    replyMessageData.value = null
  }

  const handleSetReplyMessageData = ({
    messageId,
    textMessage,
    messageType,
    senderUserId,
    document,
  }) => {
    if (messageId) {
      let newData = {
        messageId,
        textMessage,
        messageType,
        senderUserId,
      }
      if (document) {
        newData.document = document
      }
      replyMessageData.value = newData
    }
  }

  const resetPaginationMessagesComparisonWorker = () => {
    if (paginationMessagesComparisonWorker.value) {
      paginationMessagesComparisonWorker.value.terminate()
      paginationMessagesComparisonWorker.value = null
    }
  }

  const setPaginationMessagesComparisonWorker = () => {
    paginationMessagesComparisonWorker.value = new StreamsChatRoomWorker()
  }

  const resetMainMessagesEventSource = () => {
    if (mainMessagesEventSource.value) {
      mainMessagesEventSource.value.close()
      mainMessagesEventSource.value = null
    }
  }

  const setMainMessagesEventSource = (profileId) => {
    mainMessagesEventSource.value = new EventSource(
      `${clientUrl}/chat-room/stream?chatId=${chatRoom.value?.chatId}&chatRoomId=${chatRoom.value?.chatRoomId}&profileId=${profileId}`,
    )
  }

  const setMainMessagesWorkerOnScrollBottom = () => {
    getMainMessagesWorkerOnScrollBottom.value = new GetChatRoomWorker()
  }

  const resetMainMessagesWorkerOnScrollBottom = () => {
    if (getMainMessagesWorkerOnScrollBottom.value) {
      getMainMessagesWorkerOnScrollBottom.value.terminate()
      getMainMessagesWorkerOnScrollBottom.value = null
    }
  }

  const setMainMessagesWorker = () => {
    mainMessagesWorker.value = new MainMessagesWorker()
  }

  const resetMainMessagesWorker = () => {
    if (mainMessagesWorker.value) {
      mainMessagesWorker.value.terminate()
      mainMessagesWorker.value = null
      totalMainMessagesEventSource.value = 0
      loadingMainMessagesEventSource.value = false
    }
  }

  const handleGetMainMessagesOnScrollBottom = async (profileId) => {
    const messages = await fetchMessagesPagination({
      chatId: chatRoom.value.chatId,
      chatRoomId: chatRoom.value.chatRoomId,
      isFirstMessage: true,
      profileId,
    })
    if (messages?.messages) {
      chatRoomMessages.value = messages.messages
      triggerRef(chatRoomMessages)

      scroller.value.scrollToItem(0)
      loadingMainMessagesOnScrollBottom.value = false
      showScrollDownButton.value = false
    }

    // resetMainMessagesEventSource()
    // resetMainMessagesWorkerOnScrollBottom()
    // resetMainMessagesWorker()
    // loadingMainMessagesOnScrollBottom.value = true
    // loadingMainMessagesEventSource.value = true
    // setMainMessagesWorkerOnScrollBottom()
    // setMainMessagesWorker()
    // getMainMessagesWorkerOnScrollBottom.value.postMessage({
    //   chatRoomId: chatRoom.value?.chatRoomId,
    //   profileId,
    // })
    // getMainMessagesWorkerOnScrollBottom.value.onmessage = (event) => {
    //   if (event.data.length > 0) {
    //     chatRoomMessages.value = createNewMessages([
    //       ...bufferNewMessagesOnScrollBottom.value,
    //       ...event.data,
    //     ])
    //   } else if (bufferNewMessagesOnScrollBottom.value.length > 0) {
    //     chatRoomMessages.value = createNewMessages([
    //       ...bufferNewMessagesOnScrollBottom.value,
    //       ...chatRoomMessages.value,
    //     ])
    //   }
    //   scroller.value.scrollToItem(0)
    //   loadingMainMessagesOnScrollBottom.value = false
    //   showScrollDownButton.value = false
    //   resetMainMessagesWorkerOnScrollBottom()
    // }
    // setMainMessagesEventSource(profileId)
    // mainMessagesEventSource.value.onmessage = (event) => {
    //   const message = JSON.parse(event.data)
    //   if (message?.length) {
    //     mainMessagesWorker.value.postMessage({
    //       streams: message.map((msg) => ({
    //         id: msg.messageId,
    //         chatRoomId: chatRoom.value?.chatRoomId,
    //         chatId: chatRoom.value?.chatId,
    //         ...msg,
    //       })),
    //       messages: toRaw(chatRoomMessages.value),
    //     })
    //     mainMessagesWorker.value.onmessage = async (event) => {
    //       const { messages, totalStreams } = event.data
    //       if (messages?.length === 0 || totalStreamsMainMessagesWorker.value >= ITEMS_PER_PAGE) {
    //         resetMainMessagesWorker()
    //         resetMainMessagesEventSource()
    //       } else if (totalStreams < ITEMS_PER_PAGE) {
    //         chatRoomMessages.value = createNewMessages([...messages, ...chatRoomMessages.value])
    //         await nextTick()
    //         await nextTick()
    //         triggerRef(chatRoomMessages)
    //         scroller.value.$refs.scroller.$forceUpdate(true)
    //       }
    //       totalStreamsMainMessagesWorker.value += totalStreams
    //     }
    //     totalMainMessagesEventSource.value += message.length
    //   } else {
    //     resetMainMessagesWorker()
    //     resetMainMessagesEventSource()
    //   }
    // }
    // mainMessagesEventSource.value.addEventListener('done', (event) => {
    //   const message = JSON.parse(event.data)
    //   if (message?.length === 0) {
    //     resetMainMessagesWorker()
    //     resetMainMessagesEventSource()
    //   }
    // })
    // mainMessagesEventSource.value.addEventListener('error', (event) => {
    //   console.error('Streaming error:', event)
    //   resetMainMessagesWorker()
    //   resetMainMessagesEventSource()
    // })
  }

  function setChatRoom(chatRoomData) {
    chatRoom.value = chatRoomData
  }

  function setChatRoomMessages(value) {
    chatRoomMessages.value = value
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

          chatRoomMessages.value = createNewMessages(newMessages)

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

    const latestMessage = newMessage?.latestMessage?.find((msg) => msg.userId === profileId)

    if (newMessage?.isHeader) {
      newData = {
        ...newMessage,
        id: newMessage.messageId,
        chatRoomId: chatRoom.value?.chatRoomId,
        chatId: chatRoom.value?.chatId,
      }
      delete newData.eventType
      delete newData.latestMessage

      // save to indexedDB
      // addNewMessageWorker.value.postMessage({
      //   chatRoomId: chatRoom.value?.chatRoomId,
      //   chatId: chatRoom.value?.chatId,
      //   item: toRaw(newData),
      // })

      if (loadingMainMessagesOnScrollBottom.value) {
        bufferNewMessagesOnScrollBottom.value.unshift(newData)
      }

      // if (!loadingMainMessagesOnScrollBottom.value) {
      //   handleAddNewMessageOnEventSource(newData, profileId)
      // }

      if (
        !triggerScrollToMessageIdIsDone.value &&
        !loadingMainMessagesOnScrollBottom.value &&
        !showScrollDownButton.value &&
        !loadingMessagesPagination.value &&
        isStartIndex.value
      ) {
        chatRoomMessages.value = removeDuplicates(
          [newData, ...chatRoomMessages.value],
          'messageId',
        ).sort(sortByTimestamp)

        if (toRaw(chatRoomMessages.value).length > ITEMS_PER_PAGE) {
          await nextTick()
          chatRoomMessages.value = chatRoomMessages.value.slice(0, -1)
        }
      }

      if (
        !loadingMainMessagesOnScrollBottom.value &&
        !showScrollDownButton.value &&
        loadingMessagesPagination.value
      ) {
        bufferNewMessages.value.unshift(newData)
      }

      return
    }

    if (!latestMessage) {
      return
    }

    newData = {
      ...latestMessage,
      id: latestMessage.messageId,
      chatRoomId: chatRoom.value?.chatRoomId,
      chatId: chatRoom.value?.chatId,
    }
    if (newData?.replyView) {
      newData.replyView = toRaw(newData.replyView)
    }

    // save to indexedDB
    // addNewMessageWorker.value.postMessage({
    //   chatRoomId: chatRoom.value?.chatRoomId,
    //   chatId: chatRoom.value?.chatId,
    //   item: toRaw(newData),
    // })

    if (loadingMainMessagesOnScrollBottom.value) {
      bufferNewMessagesOnScrollBottom.value.unshift(newData)
    }

    // if (!loadingMainMessagesOnScrollBottom.value) {
    //   handleAddNewMessageOnEventSource(newData, profileId)
    // }

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
        const headerId = generateRandomId(15)
        chatRoomMessages.value = removeDuplicates(
          [
            {
              isHeader: true,
              id: headerId,
              messageId: headerId,
              senderUserId: newData.senderUserId,
              timeId: newData.timeId,
              chatId: newData.chatId,
              chatRoomId: newData.chatRoomId,
              latestMessageTimestamp: Number(newData.latestMessageTimestamp),
            },
            ...chatRoomMessages.value,
          ],
          'messageId',
        ).sort(sortByTimestamp)

        triggerRef(chatRoomMessages)
      }

      chatRoomMessages.value = removeDuplicates(
        [
          {
            ...newData,
          },
          ...chatRoomMessages.value,
        ],
        'messageId',
      ).sort(sortByTimestamp)

      if (toRaw(chatRoomMessages.value).length > ITEMS_PER_PAGE) {
        await nextTick()
        chatRoomMessages.value = chatRoomMessages.value.slice(0, -1)
      }

      if (newData?.senderUserId === profileId) {
        scroller.value.$refs.scroller.$forceUpdate(true)
        scroller.value.scrollToItem(0)
      }
    }

    if (
      !loadingMainMessagesOnScrollBottom.value &&
      !showScrollDownButton.value &&
      loadingMessagesPagination.value
    ) {
      bufferNewMessages.value.unshift(newData)
    }
  }

  function handleReadMessage(messageId) {
    const currentMessageIndex = toRaw(chatRoomMessages.value)?.findIndex(
      (msg) => msg.messageId === messageId,
    )
    if (currentMessageIndex === -1) {
      return
    }
    chatRoomMessages.value[currentMessageIndex].status = 'READ'
    triggerRef(chatRoomMessages)

    // save to indexedDB
    // paginationMessagesComparisonWorker.value.postMessage({
    //   chatRoomId: chatRoom.value?.chatRoomId,
    //   messageId: messageId,
    //   type: 'read-message',
    // })
  }

  function handleSetAddNewMessageWorker() {
    addNewMessageWorker.value = new AddNewMessageWorker()
  }

  function handleStopAddNewMessageWorker() {
    addNewMessageWorker.value.terminate()
    addNewMessageWorker.value = null
  }

  function resetChatRoomEventSource() {
    if (chatRoomEventSource.value) {
      chatRoomEventSource.value.close()
      chatRoomEventSource.value = null
    }
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

  const timeOutDoneStreams = () => {
    setTimeout(() => {
      loadingMessages.value = false
      handleStopStreamsChatRoomWorker()
      resetChatRoomEventSource()
      handleStopGetChatRoomWorker()
    }, 10000)
  }

  const timeOutErrorStreams = () => {
    setTimeout(() => {
      loadingMessages.value = false
      // resetChatRoomEventSource()
      // handleStopGetChatRoomWorker()
      // handleStopStreamsChatRoomWorker()
    }, 10000)
  }

  const timeOutOnmessageStreamsChatRoomWorker = () => {
    setTimeout(() => {
      handleStopGetChatRoomWorker()
      handleStopStreamsChatRoomWorker()
      resetChatRoomEventSource()
    }, 10000)
  }

  const setDataStreamsToIndexedDB = (value) => {
    updateStreamsToIndexedDB.value = value
  }

  const resetTotalStreamsLength = () => {
    totalStreamsLength.value = null
  }

  const triggerSendMessage = () => {
    const scrollTop = scroller.value?.$el?.scrollTop
    stayScrollCurrently.value = scrollTop
  }

  async function handleClickUser(userId, item, isNewChatRoom) {
    if (chatRoom.value?.chatId && chatRoom.value?.chatId === item?.chatId) {
      return
    }
    totalStreamsChatRoomWorkerDones.value = 0
    setDataStreamsToIndexedDB(null)
    resetTotalStreamsLength()
    handleResetConfirmDeleteMessage()
    handleResetActiveSelectReactions()
    goingScrollToMessageId.value = null
    resetReplyMessageData()
    resetActiveMessageMenu()
    loadingMessages.value = true
    headerRefs.value = {}
    triggerRef(headerRefs)

    resetPaginationMessagesComparisonWorker()
    // setPaginationMessagesComparisonWorker()

    resetMainMessagesEventSource()
    resetMainMessagesWorkerOnScrollBottom()
    resetMainMessagesWorker()

    handleStopGetChatRoomWorker()
    // handleSetGetChatRoomWorker()

    handleStopStreamsChatRoomWorker()
    // handleSetStreamsChatRoomWorker()

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
    let totalMessages = []
    let isEmptyChatRoomDB = null
    let keyLoopStreams = 0

    Object.assign(chatRoom.value, {
      chatId: itemCurrently.chatId,
      chatRoomId: itemCurrently.chatRoomId,
      userIds: itemCurrently.userIds.slice(),
    })

    const messages = await fetchMessagesPagination({
      chatId: itemCurrently.chatId,
      chatRoomId: itemCurrently.chatRoomId,
      isFirstMessage: true,
      profileId: userId,
    })
    if (messages?.messages) {
      chatRoomMessages.value = [...chatRoomMessages.value, ...messages.messages]
      triggerRef(chatRoomMessages)
    }

    loadingMessages.value = false

    // chatRoomEventSource.value = new EventSource(
    //   `${clientUrl}/chat-room/stream?chatId=${itemCurrently?.chatId}&chatRoomId=${itemCurrently?.chatRoomId}&profileId=${userId}`,
    // )

    // chatRoomEventSource.value.onmessage = async (event) => {
    //   const message = JSON.parse(event.data)
    //   totalMessages.push(...message)
    //   if (message?.length) {
    //     if (chatRoomMessages.value.length === 0 && getChatRoomWorker.value) {
    //       getChatRoomWorker.value.postMessage({
    //         chatRoomId: itemCurrently.chatRoomId,
    //         profileId: userId,
    //         streams: message,
    //       })
    //     }

    //     if (getChatRoomWorker.value) {
    //       getChatRoomWorker.value.onmessage = (event) => {
    //         if (event.data.length === 0) {
    //           isEmptyChatRoomDB = true
    //         } else {
    //           chatRoomMessages.value = removeDuplicates(
    //             [...chatRoomMessages.value, ...event.data],
    //             'messageId',
    //           ).sort(sortByTimestamp)
    //           triggerRef(chatRoomMessages)
    //           loadingMessages.value = false
    //         }
    //         loadingGetChatRoom = false
    //         nextTick(async () => {
    //           await nextTick()
    //           handleStopGetChatRoomWorker()
    //         })
    //       }
    //     }

    //     if (loadingGetChatRoom) {
    //       // save current load streams to buffer first
    //       if (bufferMessages.length < ITEMS_PER_PAGE) {
    //         bufferMessages.push(...message)
    //       }
    //     } else if (
    //       !loadingGetChatRoom &&
    //       isEmptyChatRoomDB &&
    //       toRaw(chatRoomMessages.value).length < ITEMS_PER_PAGE
    //     ) {
    //       chatRoomMessages.value = createNewMessages([
    //         ...chatRoomMessages.value,
    //         ...bufferMessages,
    //         ...message,
    //       ])
    //       triggerRef(chatRoomMessages)
    //       if (toRaw(chatRoomMessages.value).length >= ITEMS_PER_PAGE) {
    //         isEmptyChatRoomDB = false
    //       }
    //       loadingMessages.value = false
    //     } else if (!loadingGetChatRoom) {
    //       // jalankan jika sudah mengambil data dari indexedDB
    //       // dan check setiap streams di state
    //       // apakah ada data yang terbaru di streams dan replace
    //       if (toRaw(chatRoomMessages.value).length < ITEMS_PER_PAGE) {
    //         // chatRoomMessages.value = createNewMessages([...chatRoomMessages.value, ...message])
    //         chatRoomMessages.value = createNewMessages(
    //           messageMatching(
    //             [...totalMessages, ...toRaw(chatRoomMessages.value)],
    //             [...totalMessages, ...toRaw(chatRoomMessages.value)],
    //           ),
    //         )
    //         chatRoomMessages.value = [...chatRoomMessages.value]
    //         triggerRef(chatRoomMessages)
    //       } else {
    //         // untuk memastikan kalau ada data yang baru di chatRoomMessages jadi tidak di remove
    //         // untuk memastikan setiap streams masuk ke state
    //         // dan jika ada item di indexedDB yang tidak ada di streams itu dapat dihapus
    //         chatRoomMessages.value = messageMatching(
    //           removeDuplicates([...totalMessages, ...toRaw(chatRoomMessages.value)], 'messageId'),
    //           toRaw(chatRoomMessages.value),
    //         )
    //         chatRoomMessages.value = [...chatRoomMessages.value]
    //         triggerRef(chatRoomMessages)
    //       }
    //       bufferMessages = []
    //       loadingMessages.value = false
    //     }

    //     setDataStreamsToIndexedDB(message)

    //     // streamsChatRoomWorker.value.postMessage({
    //     //   chatRoomId: itemCurrently?.chatRoomId,
    //     //   chatId: itemCurrently?.chatId,
    //     //   streams: message,
    //     // })

    //     // streamsChatRoomWorker.value.onmessage = (event) => {
    //     //   totalStreamsIndexedDB += event.data

    //     //   if (totalStreamsIndexedDB >= ITEMS_PER_PAGE) {
    //     //     totalMessages = []
    //     //     isStreamsDone = true

    //     //     timeOutOnmessageStreamsChatRoomWorker()
    //     //   } else if (isStreamsDone && totalStreamsIndexedDB === totalMessagesLength) {
    //     //     timeOutDoneStreams()
    //     //     totalMessages = []
    //     //     isStreamsDone = true
    //     //   }
    //     // }
    //     keyLoopStreams += 1
    //   } else {
    //     resetChatRoomEventSource()
    //     handleStopStreamsChatRoomWorker()
    //     handleStopGetChatRoomWorker()
    //   }
    // }

    // chatRoomEventSource.value.addEventListener('done', (event) => {
    //   const message = JSON.parse(event.data)
    //   if (message?.length === 0 || message?.totalMessages === 0) {
    //     loadingMessages.value = false
    //     deleteChatRoomById(itemCurrently.chatRoomId)
    //     handleStopStreamsChatRoomWorker()
    //     resetChatRoomEventSource()
    //     handleStopGetChatRoomWorker()
    //   }
    //   totalStreamsLength.value = message?.totalMessages
    //   resetChatRoomEventSource()
    //   bufferMessages = []
    // })

    // chatRoomEventSource.value.addEventListener('error', (e) => {
    //   // console.error('Streaming error:', e)
    //   // loadingMessages.value = false
    //   bufferMessages = []
    // })
  }

  return {
    formMessage,
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
    loadingMainMessagesOnScrollBottom,
    bufferNewMessagesOnScrollBottom,
    bufferMainMessagesEventSource,
    loadingMainMessagesEventSource,
    paginationMessagesComparisonWorker,
    replyMessageData,
    activeMessageMenu,
    goingScrollToMessageId,
    loadingScrollToGoMessageId,
    activeSelectReactions,
    confirmDeleteMessage,
    updateStreamsToIndexedDB,
    streamsChatRoomWorker,
    totalStreamsLength,
    totalStreamsChatRoomWorkerDones,
    attachments,
    stayScrollCurrently,
    proccessSubmitAttachmentData,
    activeMediaData,
    usersTyping,
    lightboxEl,
    galleryInstance,
    handleUpdateUsersTyping,
    handleSetActiveMediaData,
    handleResetActiveMediaData,
    triggerSendMessage,
    handleSetAttachment,
    handleResetAttachment,
    setDataStreamsToIndexedDB,
    resetTotalStreamsLength,
    handleResetConfirmDeleteMessage,
    handleSetConfirmDeleteMessage,
    handleSetActiveSelectReactions,
    handleResetActiveSelectReactions,
    handleScrollToGoMessage,
    resetActiveMessageMenu,
    handleActiveMessageMenu,
    handleSetReplyMessageData,
    resetReplyMessageData,
    resetPaginationMessagesComparisonWorker,
    resetMainMessagesWorker,
    resetMainMessagesEventSource,
    resetMainMessagesWorkerOnScrollBottom,
    handleGetMainMessagesOnScrollBottom,
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
