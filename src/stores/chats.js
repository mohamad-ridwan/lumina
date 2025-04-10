import { defineStore } from 'pinia'
import { shallowRef, triggerRef } from 'vue'

export const chatsStore = defineStore('chats', () => {
  const chats = shallowRef([])

  function setChats(chatsData, isTriggerRef) {
    chats.value = chatsData
    if (isTriggerRef) {
      triggerRef(chats)
    }
  }

  return { chats, setChats }
})
