<script setup>
import { generateRandomId } from '@/helpers/generateRandomId';
import { socket } from '@/services/socket/socket';
import { useChatRoomStore } from '@/stores/chat-room';
import { usersStore } from '@/stores/users';
import { Form } from '@primevue/forms';
import { storeToRefs } from 'pinia';
import { Button, Textarea } from 'primevue';
import { computed, onUnmounted, ref } from 'vue';

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
const typingTimeout = ref(null);
const isTyping = ref(false);

// logic
const memoizedChatRoomId = computed(() => chatRoom.value.chatRoomId);
const memoizedChatId = computed(() => chatRoom.value.chatId);
const userIdCurrently = computed(() => {
  if (!chatRoom.value?.userIds) {
    return null
  }
  return chatRoom.value?.userIds.find(id => id !== profile.value?.data?.id)
})
const formattedText = computed(() => {
  return initialValues.value.textMessage.replace(/\n/g, '<br>');
});

const onFormSubmit = () => {
  if (initialValues.value.textMessage.trim()) {
    socket.emit('sendMessage', {
      chatRoomId: memoizedChatRoomId.value,
      chatId: memoizedChatId.value,
      latestMessage: {
        messageId: generateRandomId(15),
        senderUserId: profile.value.data.id,
        messageType: 'text',
        textMessage: formattedText.value,
        latestMessageTimestamp: Date.now(),
        status: "UNREAD"
      },
      eventType: 'send-message'
    })
    initialValues.value.textMessage = ''
  }
};

const handleTextareaKeydown = (event) => {
  if (event.key === 'Enter' && event.shiftKey) {
    // Shift + Enter: Sisipkan baris baru
    initialValues.value.textMessage += '\n';
    // Mencegah perilaku default Enter (submit jika tidak ada preventDefault di form)
    event.preventDefault();
  } else if (event.key === 'Enter') {
    // Enter saja: Submit pesan
    event.preventDefault(); // Mencegah baris baru
    onFormSubmit();
  }
};

const emitTypingStart = () => {
  isTyping.value = true;
  socket.emit('typing-start', { senderId: profile.value?.data.id, recipientId: userIdCurrently.value });
};

const emitTypingStop = () => {
  isTyping.value = false;
  socket.emit('typing-stop', { senderId: profile.value?.data.id, recipientId: userIdCurrently.value });
};


const handleInputChange = (event) => {
  clearTimeout(typingTimeout.value);

  if (!isTyping.value && event.target.value.length > 0) {
    emitTypingStart();
  }

  typingTimeout.value = setTimeout(() => {
    emitTypingStop();
  }, 5000);
}

// hooks rendering
onUnmounted(() => {
  clearTimeout(typingTimeout.value);
  if (isTyping.value) {
    emitTypingStop()
  }
});
</script>

<template>
  <footer>
    <div class="bg-white p-4 border-t-[#f1f1f1] border-t-[1px] w-full">
      <Form :initialValues="initialValues" @submit="onFormSubmit" class="flex items-end w-full gap-2">
        <Textarea v-model="initialValues.textMessage" rows="1" cols="20"
          class="!text-sm flex-1 rounded-l-md p-2 bg-[#f1f1f1] min-h-[38px] max-h-[150px] w-full !overflow-y-auto"
          placeholder="Type Message..." name="textMessage" :autoResize="true" @keydown="handleTextareaKeydown"
          @input="handleInputChange" />
        <Button icon="pi pi-send" aria-label="Send Message"
          class="!rounded-full !bg-[#2e74e8] hover:!bg-[#2e74e8] !h-[35px] !w-[35px] justify-center items-center flex cursor-pointer !text-white !outline-none !border-none !p-0"
          size="large" icon-class="!text-[16px] !mr-0.5 !mt-0.5" type="submit" />
      </Form>
    </div>
  </footer>
</template>
