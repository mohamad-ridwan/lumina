import { chatRoomDB } from '@/services/indexedDB/chat-room-db'

const { chatRoomDBCurrently } = chatRoomDB

self.onmessage = async (event) => {
  const chatRoom = await chatRoomDBCurrently(event.data)
  self.postMessage(chatRoom)
}
