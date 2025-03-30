<script setup>
import { usersStore } from '@/stores/users';
import FooterChatRoom from './FooterChatRoom.vue';
import HeaderChatRoom from './HeaderChatRoom.vue';
import SenderMessage from './SenderMessage.vue';
import RecipientMessage from './RecipientMessage.vue';

// store
// profile store
const userStore = usersStore()
const { profile, profileIdConnection } = userStore

// props
const { chatRoom } = defineProps(['chatRoom'])

</script>

<template>
  <div class="flex flex-col h-screen">
    <HeaderChatRoom :recipient-id="chatRoom.userIds.filter(id => id !== profile.data.id)?.[0]"
      :profile-id="profile.data.id" :profile-id-connection="profileIdConnection" />

    <main class="flex-1 overflow-y-auto p-4 space-y-2 flex flex-col-reverse bg-[#f9fafb]">
      <template v-for="item in chatRoom.data" :key="item.messageId">
        <SenderMessage v-if="item.senderUserId === profile.data.id" :text-message="item.textMessage" />
        <RecipientMessage v-if="item.senderUserId !== profile.data.id" :text-message="item.textMessage" />
      </template>
    </main>

    <FooterChatRoom />
  </div>
</template>
