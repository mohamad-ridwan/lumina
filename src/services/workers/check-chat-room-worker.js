self.addEventListener('message', (event) => {
  let messagesMap = new Map()

  event.data.messages.forEach((message) => {
    messagesMap.set(message.messageId, message)
  })

  event.data.streams.forEach((streamItem) => {
    if (messagesMap.has(streamItem.messageId)) {
      // Jika chatId sudah ada di messagesMap, periksa latestMessageTimestamp
      const existingMessage = messagesMap.get(streamItem.messageId)
      if (existingMessage.latestMessageTimestamp !== streamItem.latestMessageTimestamp) {
        // Jika latestMessageTimestamp di streams lebih baru, perbarui messagesMap
        messagesMap.set(streamItem.messageId, existingMessage)
      }
    } else {
      // Jika messageId belum ada di messagesMap, tambahkan
      messagesMap.set(streamItem.messageId, streamItem)
    }
  })

  let updateMessages = Array.from(messagesMap.values())

  self.postMessage({ messages: updateMessages })
})
