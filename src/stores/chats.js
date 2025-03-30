import { defineStore } from 'pinia'
import { ref } from 'vue'

export const chatsStore = defineStore('chats', () => {
  const chats = ref([])

  function setChats(chatsData) {
    chats.value = chatsData
  }

  return { chats, setChats }
})
