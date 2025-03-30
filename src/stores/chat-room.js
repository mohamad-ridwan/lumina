import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useChatRoomStore = defineStore('chat-room', () => {
  const chatRoom = ref({})

  function setChatRoom(chatRoomData) {
    chatRoom.value = chatRoomData
  }

  function handleReadMessage(messageId) {
    let chatDataCurrently = chatRoom.value.data
    const currentMessageIndex = chatDataCurrently.findIndex((msg) => msg.messageId === messageId)
    if (currentMessageIndex === -1) {
      return
    }
    chatDataCurrently[currentMessageIndex].status = 'READ'
  }

  return { chatRoom, setChatRoom, handleReadMessage }
})
