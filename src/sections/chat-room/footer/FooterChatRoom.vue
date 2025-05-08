<script setup>
import { generateRandomId } from '@/helpers/generateRandomId';
import { socket } from '@/services/socket/socket';
import { useChatRoomStore } from '@/stores/chat-room';
import { usersStore } from '@/stores/users';
import { Form } from '@primevue/forms';
import { storeToRefs } from 'pinia';
import { Button, Textarea } from 'primevue';
import { computed, nextTick, onBeforeUnmount, onUnmounted, ref, shallowRef, toRaw, triggerRef, watch } from 'vue';
import ReplyView from './ReplyView.vue';
import { general } from '@/helpers/general';
import dayjs from 'dayjs'
import 'dayjs/locale/id'
import isToday from 'dayjs/plugin/isToday'
import isYesterday from 'dayjs/plugin/isYesterday'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import weekday from 'dayjs/plugin/weekday'
import AttachmentMenu from '@/components/menu/AttachmentMenu.vue';
import { fetchMessagesPagination } from '@/services/api/chat-room';

dayjs.extend(isToday)
dayjs.extend(isYesterday)
dayjs.extend(weekOfYear)
dayjs.extend(weekday)

const { formatDate } = general

// store
// profile store
const userStore = usersStore()
const { profile } = storeToRefs(userStore)
// chat-room store
const chatRoomStore = useChatRoomStore()
const { resetReplyMessageData, triggerSendMessage } = chatRoomStore
const { chatRoom, replyMessageData, chatRoomMessages, formMessage, scroller, isStartIndex } = storeToRefs(chatRoomStore)

// state
const typingTimeout = ref(null);
const isTyping = ref(false);
const userIdCurrentlyState = shallowRef(null)
const footerRef = ref(null)

// logic
const memoizedChatRoomId = computed(() => chatRoom.value.chatRoomId);
const memoizedChatId = computed(() => chatRoom.value.chatId);
const formattedText = computed(() => {
  return formMessage.value.textMessage.replace(/\n/g, '<br>');
});
const isNeedHeaderDate = computed(() => {
  if (chatRoomMessages.value.length === 0) {
    return true
  }
  const headerCurrently = chatRoomMessages.value.find(message => {
    if (message?.isHeader) {
      const itemDate = dayjs(Number(message?.latestMessageTimestamp)).startOf('day')
      return formatDate(itemDate) === 'Today'
    }
    return false
  })
  return headerCurrently ? false : true
})

const onFormSubmit = async () => {
  if (formMessage.value.textMessage.trim()) {
    let latestMessage = {
      messageId: generateRandomId(15),
      senderUserId: profile.value.data.id,
      messageType: 'text',
      textMessage: formattedText.value,
      latestMessageTimestamp: Date.now(),
      status: "UNREAD"
    }

    if (toRaw(replyMessageData.value)) {
      latestMessage.replyView = toRaw(replyMessageData.value)
      if (toRaw(replyMessageData.value)?.document) {
        latestMessage.replyView.document = toRaw(replyMessageData.value).document
      }
    }
    socket.emit('sendMessage', {
      chatRoomId: memoizedChatRoomId.value,
      chatId: memoizedChatId.value,
      latestMessage,
      eventType: 'send-message',
      isNeedHeaderDate: isNeedHeaderDate.value,
      recipientProfileId: chatRoom.value?.userIds?.find(id => id !== profile.value?.data?.id)
    })
    formMessage.value.textMessage = ''
    resetReplyMessageData()
    triggerSendMessage()

    if (!isStartIndex.value) {
      const messages = await fetchMessagesPagination({
        chatId: memoizedChatId.value,
        chatRoomId: memoizedChatRoomId.value,
        isFirstMessage: true,
        profileId: profile.value?.data?.id,
      })
      if (messages?.messages) {
        chatRoomMessages.value = messages.messages
        await nextTick()
        await nextTick()
        triggerRef(chatRoomMessages)
        scroller.value.$refs.scroller.$forceUpdate(true)
        scroller.value.scrollToItem(0)
      }
    }
  }
};

const handleTextareaKeydown = (event) => {
  if (event.key === 'Enter' && event.shiftKey) {
    // Shift + Enter: Sisipkan baris baru
    formMessage.value.textMessage += '\n';
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
  socket.emit('typing-start', { senderId: profile.value?.data.id, recipientId: userIdCurrentlyState.value });
};

const emitTypingStop = () => {
  isTyping.value = false;
  socket.emit('typing-stop', { senderId: profile.value?.data.id, recipientId: userIdCurrentlyState.value });
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
});

onBeforeUnmount(() => {
  emitTypingStop()
})

watch(chatRoom, (data) => {
  if (!data?.userIds) {
    return
  }
  userIdCurrentlyState.value = data?.userIds.find(id => id !== profile.value?.data?.id)
}, { immediate: true })
</script>

<template>
  <footer ref="footerRef" class="sticky bottom-0 z-10 w-full transition-all">
    <div class="relative">
      <slot />
    </div>
    <div class="bg-white pr-4 py-4 pl-2 border-t-[#f1f1f1] border-t-[1px] w-full flex items-end gap-2">
      <AttachmentMenu />
      <div class="flex items-end flex-col w-full">
        <ReplyView />
        <Form :initialValues="formMessage" @submit="onFormSubmit" class="flex items-end w-full gap-2">
          <Textarea v-model="formMessage.textMessage" rows="1" cols="20"
            class="!text-sm flex-1 rounded-l-md p-2 bg-[#f1f1f1] min-h-[38px] max-h-[150px] w-full !overflow-y-auto"
            placeholder="Type Message..." name="textMessage" :autoResize="true" @keydown="handleTextareaKeydown"
            @input="handleInputChange" />
          <Button icon="pi pi-send" aria-label="Send Message"
            class="!rounded-full !bg-[#2e74e8] hover:!bg-[#2e74e8] !h-[35px] !w-[35px] justify-center items-center flex cursor-pointer !text-white !outline-none !border-none !p-0"
            size="large" icon-class="!text-[16px] !mr-0.5 !mt-0.5" type="submit" />
        </Form>
      </div>
    </div>
  </footer>
</template>
