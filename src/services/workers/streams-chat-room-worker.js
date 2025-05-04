import { chatRoomDB } from '@/services/indexedDB/chat-room-db'

const { addStreamsMessageToChatRoom, updateReadMessageDB, handleDeleteMessageDB } = chatRoomDB

self.onmessage = async (event) => {
  if (event.data?.type === 'read-message') {
    updateReadMessageDB(event.data.chatRoomId, event.data.messageId)
    return
  } else if (event.data?.type === 'delete-message') {
    handleDeleteMessageDB(event.data.chatRoomId, event.data.messageId)
    return
  }
  let totalMessagesLength = 0
  await addStreamsMessageToChatRoom(event.data)
  totalMessagesLength += event.data.streams.length
  self.postMessage(totalMessagesLength)
}
