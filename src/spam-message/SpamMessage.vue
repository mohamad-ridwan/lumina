<template>
  <div>
    <Button label="Spam Message" @click="showDialog" />

    <Dialog v-model:visible="dialogVisible" modal header="Konfirmasi Spam Message" :style="{ width: '50vw' }">
      <p>Apakah Anda yakin ingin mengaktifkan spam auto-send message?</p>
      <template #footer>
        <Button label="Batal" @click="dialogVisible = false" class="p-button-text" />
        <Button label="Konfirmasi" @click="startSpam" autofocus />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { onUnmounted, ref } from 'vue';
import { Button } from 'primevue/button';
import { Dialog } from 'primevue/dialog';
import { useChatRoomStore } from './stores/chatRoom';
import { usersStore } from './stores/users';
import { storeToRefs } from 'pinia';
import { generateRandomId } from './utils/generateRandomId';
import { socket } from '@/services/socket/socket';

const userStore = usersStore();
const { profile } = storeToRefs(userStore);
const chatRoomStore = useChatRoomStore();
const { chatRoom } = storeToRefs(chatRoomStore);

const dialogVisible = ref(false);
const spamInterval = ref(null);

const showDialog = () => {
  dialogVisible.value = true;
};

const startSpam = () => {
  dialogVisible.value = false;
  spamInterval.value = setInterval(() => {
    const randomMessage = generateRandomMessage();
    socket.emit('sendMessage', {
      chatRoomId: chatRoom.value.chatRoomId,
      chatId: chatRoom.value.chatId,
      latestMessage: {
        messageId: generateRandomId(15),
        senderUserId: profile.value.data.id,
        messageType: 'text',
        textMessage: randomMessage,
        latestMessageTimestamp: Date.now(),
        status: 'UNREAD',
      },
      eventType: 'send-message',
    });
  }, 1000);
};

const stopSpam = () => {
  clearInterval(spamInterval.value);
  spamInterval.value = null;
};

const generateRandomMessage = () => {
  const messages = [
    'Halo!',
    'Apa kabar?',
    'Ini pesan spam otomatis.',
    'Random message!',
    'Test spam!',
  ];
  const randomIndex = Math.floor(Math.random() * messages.length);
  return messages[randomIndex];
};

onUnmounted(() => {
  if (spamInterval.value) {
    stopSpam();
  }
});
</script>
