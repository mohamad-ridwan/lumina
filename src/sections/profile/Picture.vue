<script setup>
import { usersStore } from '@/stores/users';
import { ref } from 'vue';
import MenuCard from '@/components/menu/MenuCard.vue';
import { useChatRoomStore } from '@/stores/chat-room';
import { storeToRefs } from 'pinia';
import { general } from '@/helpers/general';
import CropperImgPreview from '@/components/modals/CropperImgPreview.vue';
import { firebaseUtils } from '@/services/firebase/firebaseUtils';
import { fetchUpdateProfile } from '@/services/api/users';
import { useToast } from 'primevue';

// users store
const userStore = usersStore()
const { profile } = storeToRefs(userStore)
// chat-room store
const chatRoomStore = useChatRoomStore()
const { handleSetActiveMediaData } = chatRoomStore

const { getUploadFile, base64ToBlob, blobToFile } = general

const menuRef = ref(null)
const loadingUpdated = ref(false)
const imgUploaded = ref({
  image: null,
  imgCropped: null,
})

const { uploadFileToFirebase } = firebaseUtils

const toast = useToast()

const items = [
  {
    label: 'See Photo', icon: 'pi-eye', command: () => {
      if (profile.value?.data?.image) {
        handleSetActiveMediaData({
          url: profile.value?.data?.image,
          username: profile.value?.data?.username,
        })
      }
    }
  },
  {
    label: 'Upload Photo', icon: 'pi-folder-open', command: async () => {
      const file = await getUploadFile()
      if (file) {
        imgUploaded.value = {
          image: file,
          imgCropped: URL.createObjectURL(file),
        }
      }
    }
  },
  { label: 'Delete Photo', icon: 'pi-trash', command: () => console.log('Delete Photo') }
];

const toggleMenu = (event) => {
  if (loadingUpdated.value) return
  menuRef.value?.menu?.toggle?.(event);
};

const closeCropper = () => {
  imgUploaded.value = null
}

const handleSubmit = async (url) => {
  if (loadingUpdated.value) return
  loadingUpdated.value = true

  const blob = base64ToBlob(url)
  const file = blobToFile(blob, 'profile.jpg')
  const imgResult = await Promise.all([
    uploadFileToFirebase(file, 'lumina/images'),
    uploadFileToFirebase(imgUploaded.value.image, 'lumina/images')
  ])
  const urlCroppedImage = imgResult[0]
  const urlImage = imgResult[1]
  if (!urlCroppedImage) {
    loadingUpdated.value = false
    toast.add({ severity: 'error', summary: 'An error occurred. Please try again.', life: 3000 });
    return
  }
  if (!urlImage) {
    loadingUpdated.value = false
    toast.add({ severity: 'error', summary: 'An error occurred. Please try again.', life: 3000 });
    return
  }
  const profileUpdated = await fetchUpdateProfile({
    id: profile.value?.data?.id,
    imgCropped: urlCroppedImage,
    image: urlImage,
  })
  if (profileUpdated?.isErr) {
    loadingUpdated.value = false
    toast.add({ severity: 'error', summary: profileUpdated.message, life: 3000 });
    return
  }
  toast.add({ severity: 'success', summary: profileUpdated.message, life: 3000 })
  profile.value.data.imgCropped = urlCroppedImage
  profile.value.data.image = urlImage
  loadingUpdated.value = false
}
</script>

<template>
  <CropperImgPreview @close="closeCropper" :imgUploaded="imgUploaded" @submit="handleSubmit" />
  <div class="w-full flex justify-center items-center bg-[#F1F1F1] px-2 py-5">
    <div class="relative group h-[150px] w-[150px] rounded-full overflow-hidden">
      <img :src="profile?.data?.imgCropped" alt="Profile Image"
        :class="`h-full w-full object-cover ${loadingUpdated ? 'cursor-not-allowed' : 'cursor-pointer'}`"
        @click="toggleMenu" />
      <div
        :class="`absolute inset-0 bg-black/60 flex flex-col justify-center items-center text-white ${!loadingUpdated ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'} transition-opacity duration-300 pointer-events-none`">
        <div v-if="!loadingUpdated" class="flex flex-col justify-center items-center gap-1">
          <i class="pi pi-camera text-lg mb-1"></i>
          <span class="text-sm">Change Profile Photo</span>
        </div>
        <div v-else class="flex flex-col justify-center items-center gap-1">
          <i class="pi pi-spin pi-spinner text-lg mb-1"></i>
          <span class="text-sm">Updating...</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Menu akan muncul saat gambar di klik -->
  <MenuCard ref="menuRef" :items="items" :isUseBtnToggle="false" />
</template>
