import { chatRoomDB } from '@/services/indexedDB/chat-room-db'

const { addMessageToChatRoom } = chatRoomDB

self.onmessage = async (event) => {
  await addMessageToChatRoom(event.data)
  self.postMessage('next')
}
