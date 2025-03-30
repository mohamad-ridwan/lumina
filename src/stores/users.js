import { generateRandomId } from '@/helpers/generateRandomId'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const usersStore = defineStore('users', () => {
  const profile = ref(null)
  const profileIdConnection = ref(null)

  function setProfile(profileData) {
    profile.value = profileData
  }
  function setProfileIdConnection() {
    profileIdConnection.value = generateRandomId(13)
  }

  return { profile, profileIdConnection, setProfile, setProfileIdConnection }
})
