import { chatRoomDB } from '@/services/indexedDB/chat-room-db'

const { addStreamsMessageToChatRoom } = chatRoomDB

self.onmessage = async (event) => {
  let totalMessagesLength = 0
  await addStreamsMessageToChatRoom(event.data)
  totalMessagesLength += event.data.streams.length
  self.postMessage(totalMessagesLength)
}
