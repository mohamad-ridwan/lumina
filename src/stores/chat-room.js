import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useChatRoomStore = defineStore('chat-room', () => {
  const chatRoom = ref({})

  function setChatRoom(chatRoomData) {
    chatRoom.value = chatRoomData
  }

  return { chatRoom, setChatRoom }
})
