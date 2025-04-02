<template>
  <div>
    <Dialog v-model:visible="dialogVisible" modal header="Konfirmasi Spam Message" :style="{ width: '50vw' }">
      <p v-if="!spamInterval">Apakah Anda yakin ingin mengaktifkan spam auto-send message?</p>
      <p v-else>Spam message sedang berjalan. Klik "Stop Spam" untuk menghentikan.</p>
      <template #footer>
        <Button v-if="!spamInterval" label="Batal" @click="dialogVisible = false" class="p-button-text" />
        <Button v-if="!spamInterval" label="Konfirmasi" @click="startSpam" autofocus />
        <Button v-if="spamInterval" label="Stop Spam" @click="stopSpam" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { onUnmounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { socket } from '@/services/socket/socket';
import { useChatRoomStore } from '@/stores/chat-room';
import { usersStore } from '@/stores/users';
import { generateRandomId } from '@/helpers/generateRandomId';
import { Button, Dialog } from 'primevue';

const userStore = usersStore();
const { profile } = storeToRefs(userStore);
const chatRoomStore = useChatRoomStore();
const { chatRoom } = storeToRefs(chatRoomStore);

const dialogVisible = ref(true);
const spamInterval = ref(null);

const startSpam = () => {
  dialogVisible.value = true;
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
  dialogVisible.value = true;
};

const generateRandomMessage = () => {
  const messages = [
    'Halo!',
    'Apa kabar?',
    'Ini pesan spam otomatis.',
    'Random message!',
    'Test spam!',
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla fermentum sollicitudin porta. Aenean luctus congue metus sed eleifend. Nunc bibendum nisl eu porta porttitor. ',
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
