import { general } from '@/helpers/general'

const { sortByTimestamp } = general

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
    const currentMessages = targetChat.messages
      .filter((item) => item?.messageId)
      .sort(sortByTimestamp)

    return currentMessages.slice(0, 150)
  }
  return []
}

const fetchPaginatedFromIndexedDB = async (chatRoomId, start, end) => {
  const db = await openChatRoomDB()
  const tx = db.transaction('chat-room', 'readonly')
  const store = tx.objectStore('chat-room')

  const getRequest = store.get(chatRoomId)
  const targetChat = await new Promise((resolve, reject) => {
    getRequest.onsuccess = () => resolve(getRequest.result)
    getRequest.onerror = () => reject(getRequest.error)
  })

  if (!targetChat || !Array.isArray(targetChat.messages)) {
    return []
  }

  // Urutkan pesan terbaru ke terlama (jika diperlukan)
  const sorted = [...targetChat.messages].sort(
    (a, b) => Number(b.latestMessageTimestamp) - Number(a.latestMessageTimestamp),
  )

  return sorted.slice(start, end)
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

    const combinedMessages = [...existingMessages, ...newMessages]

    // Urutkan berdasarkan:
    // 1. latestMessageTimestamp ascending
    // 2. isHeader true berada di atas jika timestamp sama
    combinedMessages.sort(sortByTimestamp)

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

export const chatRoomDB = {
  openChatRoomDB,
  chatRoomDBCurrently,
  fetchPaginatedFromIndexedDB,
  addMessageToChatRoom,
  addStreamsMessageToChatRoom,
}
