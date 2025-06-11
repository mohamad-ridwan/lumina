<script setup>
import { Button } from 'primevue';
import { computed, ref, toRefs } from 'vue';
import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import relativeTime from 'dayjs/plugin/relativeTime';
import weekday from 'dayjs/plugin/weekday';
import isToday from 'dayjs/plugin/isToday';
import isYesterday from 'dayjs/plugin/isYesterday';
import VLazyImage from "v-lazy-image";

dayjs.extend(localizedFormat)
dayjs.extend(relativeTime);
dayjs.extend(weekday);
dayjs.extend(isToday);
dayjs.extend(isYesterday);

const props = defineProps(['textMessage', 'username', 'fontSizeUsername', 'imgSize', 'heightContainer', 'latestMessageTimestamp', 'unreadCount', 'isActive', 'image', 'status', 'isTyping', 'document', 'latestMessage', 'profileId', 'thumbnail', 'imgCropped'])

const emits = defineEmits(['click'])

const { textMessage, username, fontSizeUsername, imgSize, heightContainer, unreadCount, isActive, image, status, isTyping, document, latestMessage, profileId, thumbnail, imgCropped } = toRefs(props)

const isErrorImage = ref(false)

const handleClick = () => {
  emits('click')
}

const latestMessageCurrently = computed(() => {
  const currentLatestMessage = latestMessage.value?.find(msg => msg?.userId === profileId.value)
  if (!currentLatestMessage) {
    return
  }
  return currentLatestMessage
})

const formattedDate = computed(() => {
  if (!latestMessageCurrently.value?.latestMessageTimestamp) {
    return ''
  }
  const timestampInMilliseconds = Number(latestMessageCurrently.value.latestMessageTimestamp);

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

const memoizedImage = computed(() => {
  if (!imgCropped.value && image.value) {
    return image.value
  } else if (imgCropped.value) {
    if (isErrorImage.value && thumbnail.value) {
      return thumbnail.value
    }
    return imgCropped.value
  }
  return '/avatar.png'
})

const isDeleted = computed(() => {
  if (!latestMessageCurrently.value?.isDeleted || latestMessageCurrently.value?.isDeleted?.length === 0) {
    return
  }
  const deletedEveryone = latestMessageCurrently.value.isDeleted.find(data => data?.deletionType === 'everyone' || data?.deletionType === 'permanent')
  if (!deletedEveryone) {
    return
  }
  if (deletedEveryone?.senderUserId === profileId.value) {
    return 'You deleted this message.'
  } else if (deletedEveryone?.senderUserId !== profileId.value) {
    return 'Message has been deleted.'
  }
  return
})

const fromMe = computed(() => {
  if (!latestMessageCurrently.value) return false
  return latestMessageCurrently.value?.senderUserId === profileId.value ? true : false
})

const formattedTextMessage = computed(() => {
  if (isDeleted.value) {
    return isDeleted.value
  }
  if (!latestMessageCurrently.value?.document) return latestMessageCurrently.value?.textMessage?.replace(/<br\s*\/?>/gi, ' ');
  if (!latestMessageCurrently.value?.document?.caption && latestMessageCurrently.value?.document?.type === 'image') {
    return 'Photo'
  } else if (!latestMessageCurrently.value?.document?.caption && latestMessageCurrently.value?.document?.type === 'video') {
    return 'Video'
  }
  if (latestMessageCurrently.value?.document?.caption) return latestMessageCurrently.value.document.caption
});

const memoizedTypeMessageIcon = computed(() => {
  if (isDeleted.value) {
    return 'pi pi-ban'
  }
  if (!latestMessageCurrently.value?.document) return null
  if (latestMessageCurrently.value?.document.type === 'image') {
    return 'pi pi-image'
  } else if (latestMessageCurrently.value?.document.type === 'video') {
    return 'pi pi-video'
  } else if (latestMessageCurrently.value?.document.type === 'file') {
    return 'pi pi-file'
  }
})

const handleImageError = () => {
  isErrorImage.value = true
}
</script>

<template>
  <Button v-slot="slotProps" asChild type="button" severity="secondary" aria-label="chat">
    <div v-bind="slotProps" @click="handleClick()" :class="`w-full rounded-lg px-3 flex items-center gap-3 !justify-between !border-none
        ${heightContainer ?? 'h-16'}
        ${isActive ? '!bg-[#000124] hover:!bg-[#000124]' : 'bg-[#f1f1f1] hover:bg-gray-200'}
      `">

      <!-- Avatar + Info -->
      <div class="flex items-center gap-3 min-w-0">
        <!-- Avatar -->
        <div :class="`${imgSize ?? 'w-12 sm:w-14'}`">
          <div :class="`relative ${imgSize ?? 'h-12 w-12 sm:h-14 sm:w-14'}`">
            <v-lazy-image :src="memoizedImage" alt="profile" :src-placeholder="thumbnail"
              class="object-cover rounded-full h-full w-full" sizes="(max-width: 60px) 40px, 80px"
              @error="handleImageError" />
            <div v-if="status === 'online'" class="absolute bottom-0.5 right-0">
              <div class="h-[12px] w-[12px] rounded-full bg-green-500 border-[1px] border-white"></div>
            </div>
          </div>
        </div>

        <!-- Chat Info -->
        <div class="flex flex-col min-w-0">
          <!-- Username -->
          <h1 :class="`font-bold truncate ${isActive ? 'text-white' : 'text-[#111827]'} ${fontSizeUsername
            ?? 'text-sm sm:text-base'}`">
            {{ username }}
          </h1>

          <!-- Last message -->
          <p v-if="!isTyping && formattedTextMessage"
            class="opacity-0 animate-fade-in flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 w-full truncate">
            <span v-if="fromMe" class="hidden sm:inline">You:</span>
            <i v-if="memoizedTypeMessageIcon" class="!text-[13px]" :class="memoizedTypeMessageIcon"></i>
            <span class="truncate w-full" :class="`${isDeleted ? 'italic' : ''}`">{{ formattedTextMessage }}</span>
          </p>
          <p v-if="isTyping" class="opacity-0 animate-fade-in italic text-xs text-gray-600 dark:text-gray-400">
            Typing...</p>
        </div>
      </div>

      <!-- Time & Unread Count -->
      <div v-if="formattedDate" class="flex flex-col items-end gap-1 flex-shrink-0">
        <span :class="`text-[10px] ${isActive ? 'text-gray-400' : unreadCount ? 'text-[#2e74e8]' : 'text-[#6b7280]'}`">
          {{ formattedDate }}
        </span>

        <!-- Unread Messages Indicator -->
        <div v-if="unreadCount"
          class="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-[#2e74e8] flex justify-center items-center">
          <span class="text-white font-semibold rounded-full flex items-center justify-center" :class="[
            unreadCount?.toString()?.length > 3 ? 'text-[8px] px-1.5 h-3' :
              unreadCount?.toString()?.length > 2 ? 'text-[9px] px-2 h-3' :
                'text-[10px] sm:text-[12px] px-2 h-3'
          ]">{{ unreadCount }}</span>
        </div>
      </div>

    </div>
  </Button>
</template>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

.animate-fade-in {
  animation: fade-in 0.5s ease-in-out forwards;
  /* Sesuaikan durasi dan easing */
}

.v-lazy-image {
  filter: blur(2px);
  transition: filter 0.1s;
}

.v-lazy-image-loaded {
  filter: blur(0);
}
</style>
