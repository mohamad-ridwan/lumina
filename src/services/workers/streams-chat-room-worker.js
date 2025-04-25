import { chatRoomDB } from '@/services/indexedDB/chat-room-db'

const { addStreamsMessageToChatRoom, updateReadMessageDB } = chatRoomDB

self.onmessage = async (event) => {
  if (event.data?.type === 'read-message') {
    updateReadMessageDB(event.data.chatRoomId, event.data.messageId)
    return
  }
  let totalMessagesLength = 0
  await addStreamsMessageToChatRoom(event.data)
  totalMessagesLength += event.data.streams.length
  self.postMessage(totalMessagesLength)
}
