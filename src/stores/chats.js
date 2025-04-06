import { defineStore } from 'pinia'
import { markRaw, shallowRef } from 'vue'

export const chatsStore = defineStore('chats', () => {
  const chats = shallowRef([])

  function setChats(chatsData) {
    chats.value = markRaw(chatsData)
  }

  return { chats, setChats }
})
