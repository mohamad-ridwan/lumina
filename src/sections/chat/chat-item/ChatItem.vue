<script setup>
// import
import ChatProfile from '@/components/ChatProfile.vue';
import { socket } from '@/services/socket/socket';
import { useChatRoomStore } from '@/stores/chat-room';
import { usersStore } from '@/stores/users';
import { computed, onBeforeMount, onMounted, ref, shallowRef, watch, } from 'vue';
import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import relativeTime from 'dayjs/plugin/relativeTime';
import weekday from 'dayjs/plugin/weekday';
import isToday from 'dayjs/plugin/isToday';
import isYesterday from 'dayjs/plugin/isYesterday';
import { storeToRefs } from 'pinia';

dayjs.extend(localizedFormat)
dayjs.extend(relativeTime);
dayjs.extend(weekday);
dayjs.extend(isToday);
dayjs.extend(isYesterday);

// props
const { item } = defineProps(['item'])

// store
// profile store
const userStore = usersStore()
const { profile, profileIdConnection } = storeToRefs(userStore)
// chat-room store
const chatRoomStore = useChatRoomStore()
const { handleClickUser } = chatRoomStore
const { chatRoom } = storeToRefs(chatRoomStore)

// state
const name = shallowRef('')
const image = shallowRef(null)
const userProfileSocketUpdate = ref(null)

// logic
const userIdsCurrently = item.userIds.slice().find(id => id !== profile.value.data.id)
const memoizedChatRoomId = computed(() => chatRoom.value.chatRoomId);

const formattedDate = computed(() => {
  if (!item?.latestMessageTimestamp) {
    return ''
  }
  const timestampInMilliseconds = item.latestMessageTimestamp;

  const date = dayjs(timestampInMilliseconds);

  const today = dayjs();

  const oneWeekAgo = today.subtract(7, 'day');

  if (date.isToday()) {
    return date.format('HH.mm')
  } else if (date.isYesterday()) {
    return 'Yesterday'
  } else if (date.isAfter(oneWeekAgo)) {
    return date.format('dddd')
  } else {
    return date.format('DD/MM/YYYY')
  }
});

// hooks rendering
onMounted(() => {
  socket.on('user-profile', (data) => {
    userProfileSocketUpdate.value = data
  })
})

watch(userProfileSocketUpdate, (data) => {
  if (
    (data?.senderId === profile.value?.data?.id) &&
    (data?.profileIdConnection === profileIdConnection.value) &&
    (data.profile.id === userIdsCurrently) &&
    (data?.actionType === 'chats')
  ) {
    name.value = data.profile.username
    image.value = data.profile.image
  }
})

onBeforeMount(() => {
  if (profile && userIdsCurrently) {
    socket.emit('user-profile', {
      profileId: userIdsCurrently,
      senderId: profile.value.data.id,
      profileIdConnection: profileIdConnection.value,
      actionType: 'chats'
    })
  }
})
</script>

<template>
  <ChatProfile :username="name" :from-me="item.latestMessage.senderUserId === profile?.data?.id"
    :text-message="item.latestMessage.textMessage" @click="handleClickUser(profile?.data.id, item)"
    :latest-message-timestamp="formattedDate" :unread-count="item.unreadCount[profile?.data.id]"
    :is-active="item.chatRoomId === memoizedChatRoomId" :image="image" />
</template>
