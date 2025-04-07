import { defineStore } from 'pinia'
import { markRaw, shallowRef, triggerRef } from 'vue'

export const chatsStore = defineStore('chats', () => {
  const chats = shallowRef([])

  function setChats(chatsData, isTriggerRef) {
    chats.value = markRaw(chatsData)
    if (isTriggerRef) {
      triggerRef(chats)
    }
  }

  return { chats, setChats }
})
