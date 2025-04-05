<script setup>
import { Button } from 'primevue';

const { fromMe, textMessage, username, fontSizeUsername, imgSize, heightContainer, latestMessageTimestamp, unreadCount, isActive } = defineProps(['fromMe', 'textMessage', 'username', 'fontSizeUsername', 'imgSize', 'heightContainer', 'latestMessageTimestamp', 'unreadCount', 'isActive'])

const emits = defineEmits(['click'])

const handleClick = () => {
  emits('click')
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
        <img
          src="https://images.unsplash.com/photo-1611095564985-89765398121e?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Avatar" :class="`object-cover rounded-full ${imgSize ?? 'h-12 w-12 sm:h-14 sm:w-14'}`">

        <!-- Chat Info -->
        <div class="flex flex-col min-w-0">
          <!-- Username -->
          <h1
            :class="`font-bold truncate ${isActive ? 'text-white' : 'text-[#111827]'} ${fontSizeUsername ?? 'text-sm sm:text-base'}`">
            {{ username }}
          </h1>

          <!-- Last message -->
          <p v-if="textMessage"
            class="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 w-full truncate">
            <span v-if="fromMe" class="hidden sm:inline">You:</span>
            <span class="truncate w-full">{{ textMessage }}</span>
          </p>
        </div>
      </div>

      <!-- Time & Unread Count -->
      <div v-if="latestMessageTimestamp" class="flex flex-col items-center gap-1 flex-shrink-0">
        <span :class="`text-[10px] ${isActive ? 'text-gray-400' : unreadCount ? 'text-[#2e74e8]' : 'text-[#6b7280]'}`">
          {{ latestMessageTimestamp }}
        </span>

        <!-- Unread Messages Indicator -->
        <div v-if="unreadCount"
          class="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-[#2e74e8] flex justify-center items-center">
          <span class="text-[10px] sm:text-[12px] text-white font-semibold">{{ unreadCount }}</span>
        </div>
      </div>

    </div>
  </Button>
</template>
