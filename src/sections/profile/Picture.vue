<script setup>
import { usersStore } from '@/stores/users';
import { ref } from 'vue';
import MenuCard from '@/components/menu/MenuCard.vue';
import { useChatRoomStore } from '@/stores/chat-room';
import { storeToRefs } from 'pinia';

// users store
const userStore = usersStore()
const { profile } = storeToRefs(userStore)
// chat-room store
const chatRoomStore = useChatRoomStore()
const { handleSetActiveMediaData } = chatRoomStore

const menuRef = ref(null)

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
  { label: 'Upload Photo', icon: 'pi-upload', command: () => console.log('Upload Photo') },
  { label: 'Delete Photo', icon: 'pi-trash', command: () => console.log('Delete Photo') }
];

const toggleMenu = (event) => {
  menuRef.value?.menu?.toggle?.(event);
};
</script>

<template>
  <div class="w-full flex justify-center items-center bg-[#F1F1F1] px-2 py-5">
    <div class="relative group h-[150px] w-[150px] rounded-full overflow-hidden">
      <img :src="profile?.data?.image" alt="Profile Image" class="h-full w-full object-cover cursor-pointer"
        @click="toggleMenu" />
      <div
        class="absolute inset-0 bg-black/60 flex flex-col justify-center items-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <i class="pi pi-pencil text-lg mb-1"></i>
        <span class="text-sm">Change Profile Photo</span>
      </div>
    </div>
  </div>

  <!-- Menu akan muncul saat gambar di klik -->
  <MenuCard ref="menuRef" :items="items" :isUseBtnToggle="false" />
</template>
