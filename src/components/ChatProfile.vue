<script setup>
import { Button } from 'primevue';
import { computed } from 'vue';

const { fromMe, textMessage, username, fontSizeUsername, imgSize, heightContainer, latestMessageTimestamp, unreadCount, isActive, image, status, isTyping, document } = defineProps(['fromMe', 'textMessage', 'username', 'fontSizeUsername', 'imgSize', 'heightContainer', 'latestMessageTimestamp', 'unreadCount', 'isActive', 'image', 'status', 'isTyping', 'document'])

const emits = defineEmits(['click'])

const handleClick = () => {
  emits('click')
}

const formattedTextMessage = computed(() => {
  if (!document) return textMessage.replace(/<br\s*\/?>/gi, ' ');
  if (!document?.caption && document?.type === 'image') return 'Photo'
});

const memoizedTypeMessageIcon = computed(() => {
  if (!document) return null
  if (document?.type === 'image') {
    return 'pi pi-image'
  } else if (document?.type === 'video') {
    return 'pi pi-video'
  } else if (document?.type === 'file') {
    return 'pi pi-file'
  }
})
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
            <img :src="image" alt="profile" :class="`object-cover rounded-full h-full w-full`">
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
            <span class="truncate w-full">{{ formattedTextMessage }}</span>
          </p>
          <p v-if="isTyping" class="opacity-0 animate-fade-in italic text-xs text-gray-600 dark:text-gray-400">
            Typing...</p>
        </div>
      </div>

      <!-- Time & Unread Count -->
      <div v-if="latestMessageTimestamp" class="flex flex-col items-end gap-1 flex-shrink-0">
        <span :class="`text-[10px] ${isActive ? 'text-gray-400' : unreadCount ? 'text-[#2e74e8]' : 'text-[#6b7280]'}`">
          {{ latestMessageTimestamp }}
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
</style>
