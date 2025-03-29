import { defineStore } from 'pinia'
import { ref } from 'vue'

export const usersStore = defineStore('users', () => {
  const profile = ref(null)

  function setProfile(profileData) {
    profile.value = profileData
  }

  return { profile, setProfile }
})
