<script setup>
import { generateRandomId } from '@/helpers/generateRandomId';
import { socket } from '@/services/socket/socket';
import { useChatRoomStore } from '@/stores/chat-room';
import { usersStore } from '@/stores/users';
import { Form } from '@primevue/forms';
import { storeToRefs } from 'pinia';
import { InputText } from 'primevue';
import { computed, ref } from 'vue';

// store
// profile store
const userStore = usersStore()
const { profile } = storeToRefs(userStore)
// chat-room store
const chatRoomStore = useChatRoomStore()
const { chatRoom } = storeToRefs(chatRoomStore)

// state
const initialValues = ref({
  textMessage: ''
});

// logic
const memoizedChatRoomId = computed(() => chatRoom.value.chatRoomId);
const memoizedChatId = computed(() => chatRoom.value.chatId);

const onFormSubmit = () => {
  if (initialValues.value.textMessage.trim()) {
    socket.emit('sendMessage', {
      chatRoomId: memoizedChatRoomId.value,
      chatId: memoizedChatId.value,
      latestMessage: {
        messageId: generateRandomId(15),
        senderUserId: profile.value.data.id,
        messageType: 'text',
        textMessage: initialValues.value.textMessage,
        latestMessageTimestamp: Date.now(),
        status: "UNREAD"
      },
      eventType: 'send-message'
    })
    initialValues.value.textMessage = ''
  }
};
</script>

<template>
  <footer class="bg-white p-4 border-t-[#f1f1f1] border-t-[1px]">
    <Form :initialValues="initialValues" @submit="onFormSubmit" class="flex">
      <InputText v-model="initialValues.textMessage" name="textMessage" type="text" placeholder="Type Message..." fluid
        class="!text-sm flex-1 rounded-l-md p-2 bg-[#f1f1f1]" />
      <button class="bg-[#6b7280] text-white p-2 rounded-r-md">Send</button>
    </Form>
  </footer>
</template>
