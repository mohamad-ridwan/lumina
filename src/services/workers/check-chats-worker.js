self.addEventListener('message', (event) => {
  let chatMap = new Map()

  event.data.chats.forEach((chat) => {
    chatMap.set(chat.chatId, chat)
  })

  event.data.streams.forEach((streamItem) => {
    if (chatMap.has(streamItem.chatId)) {
      // Jika chatId sudah ada di chatMap, periksa latestMessageTimestamp
      const existingChat = chatMap.get(streamItem.chatId)
      if (existingChat.latestMessageTimestamp !== streamItem.latestMessageTimestamp) {
        // Jika latestMessageTimestamp di streams lebih baru, perbarui chatMap
        chatMap.set(streamItem.chatId, existingChat)
      }
    } else {
      // Jika chatId belum ada di chatMap, tambahkan
      chatMap.set(streamItem.chatId, streamItem)
    }
  })

  let updateChats = Array.from(chatMap.values())

  self.postMessage({ chats: updateChats })
})
