import { generateRandomId } from '@/helpers/generateRandomId'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const usersStore = defineStore('users', () => {
  const profile = ref(null)
  const profileIdConnection = ref(null)
  const activeProfile = ref(false)

  function setActiveProfile(isActive) {
    activeProfile.value = isActive
  }

  function setProfile(profileData) {
    profile.value = profileData
  }
  function setProfileIdConnection() {
    profileIdConnection.value = generateRandomId(13)
  }

  return {
    profile,
    profileIdConnection,
    activeProfile,
    setActiveProfile,
    setProfile,
    setProfileIdConnection,
  }
})
