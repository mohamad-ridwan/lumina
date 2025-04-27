import { general } from '@/helpers/general'
import { ITEMS_PER_PAGE } from '@/utils/pagination'

const { sortByTimestamp, removeDuplicates } = general

async function openChatRoomDB() {
  return await new Promise((resolve, reject) => {
    const request = indexedDB.open('ChatDB', 1)

    request.onupgradeneeded = function (event) {
      const db = event.target.result
      if (!db.objectStoreNames.contains('chat-room')) {
        db.createObjectStore('chat-room', { keyPath: 'chatRoomId' })
      }
    }

    request.onsuccess = function (event) {
      resolve(event.target.result)
    }

    request.onerror = function (event) {
      reject(event.target.error)
    }
  })
}

const updateReadMessageDB = async (chatRoomId, messageId) => {
  const db = await openChatRoomDB()
  const tx = db.transaction('chat-room', 'readwrite')
  const store = tx.objectStore('chat-room')

  const getRequest = store.get(chatRoomId)
  const targetChat = await new Promise((resolve, reject) => {
    getRequest.onsuccess = () => resolve(getRequest.result)
    getRequest.onerror = () => reject(getRequest.error)
  })

  if (targetChat) {
    const indexMessage = targetChat.messages.findIndex((message) => message.messageId === messageId)
    if (indexMessage !== -1) {
      targetChat.messages[indexMessage].status = 'READ'
    }
    store.put(targetChat)
  }

  await tx.done
}

const chatRoomDBCurrently = async (chatRoomId) => {
  const db = await openChatRoomDB()
  const tx = db.transaction('chat-room', 'readwrite')
  const store = tx.objectStore('chat-room')

  const getRequest = store.get(chatRoomId)
  const targetChat = await new Promise((resolve, reject) => {
    getRequest.onsuccess = () => resolve(getRequest.result)
    getRequest.onerror = () => reject(getRequest.error)
  })

  if (targetChat) {
    const currentMessages = removeDuplicates(targetChat.messages, 'messageId')
      .filter((item) => item?.messageId)
      .sort(sortByTimestamp)

    return currentMessages.slice(0, ITEMS_PER_PAGE)
  }
  return []
}

async function addMessageToChatRoom(data) {
  const db = await openChatRoomDB()
  const tx = db.transaction('chat-room', 'readwrite')
  const store = tx.objectStore('chat-room')

  const getRequest = store.get(data.chatRoomId)
  const targetChat = await new Promise((resolve, reject) => {
    getRequest.onsuccess = () => resolve(getRequest.result)
    getRequest.onerror = () => reject(getRequest.error)
  })

  if (targetChat) {
    targetChat.messages.unshift(data.item)
    targetChat.messages = removeDuplicates(targetChat.messages, 'messageId')
    store.put(targetChat)
  } else {
    store.add({
      chatId: data.chatId,
      chatRoomId: data.chatRoomId,
      messages: [data.item],
    })
  }

  await tx.done
  db.close()
}

async function addStreamsMessageToChatRoom(data) {
  const db = await openChatRoomDB()
  const tx = db.transaction('chat-room', 'readwrite')
  const store = tx.objectStore('chat-room')

  const getRequest = store.get(data.chatRoomId)
  const targetChat = await new Promise((resolve, reject) => {
    getRequest.onsuccess = () => resolve(getRequest.result)
    getRequest.onerror = () => reject(getRequest.error)
  })

  if (targetChat) {
    const existingMessages = Array.isArray(targetChat.messages) ? targetChat.messages : []

    // Gabungkan dengan pesan baru, hindari duplikat berdasarkan id
    const existingIds = new Set(existingMessages.map((msg) => msg.messageId))

    const newMessages = data.streams.filter((msg) => !existingIds.has(msg.messageId))

    const combinedMessages = removeDuplicates(
      [...existingMessages, ...newMessages],
      'messageId',
    ).sort(sortByTimestamp)

    const updatedChat = {
      ...targetChat,
      messages: combinedMessages,
    }

    store.put(updatedChat)
  } else {
    store.add({
      chatId: data.chatId,
      chatRoomId: data.chatRoomId,
      messages: data.streams,
    })
  }

  await tx.done
}

async function deleteChatRoomById(chatRoomId) {
  const db = await openChatRoomDB()
  const transaction = db.transaction(['chat-room'], 'readwrite')
  const objectStore = transaction.objectStore('chat-room')

  return new Promise((resolve, reject) => {
    const deleteRequest = objectStore.delete(chatRoomId)

    deleteRequest.onsuccess = function () {
      console.log(`Chat room dengan ID "${chatRoomId}" berhasil dihapus.`)
      resolve()
    }

    deleteRequest.onerror = function (event) {
      console.error('Gagal menghapus chat room:', event.target.error)
      reject(event.target.error)
    }
  })
}

export const chatRoomDB = {
  updateReadMessageDB,
  openChatRoomDB,
  chatRoomDBCurrently,
  addMessageToChatRoom,
  addStreamsMessageToChatRoom,
  deleteChatRoomById,
}
