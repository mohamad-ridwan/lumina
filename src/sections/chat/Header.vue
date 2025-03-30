<script setup>
import { theme } from '@/assets/theme';
import { useConfirm } from 'primevue/useconfirm'
import Button from 'primevue/button';
import { ref } from 'vue';
import AddNewChat from './AddNewChat.vue';

const confirm = useConfirm();

// state
const confirmState = ref(null)

const showTemplate = (event) => {
  if (confirmState.value) {
    confirmState.value = event.currentTarget
  } else {
    confirmState.value = null
    confirm.close()
  }

  confirm.require({
    target: confirmState.value,
    group: 'templating',
    message: 'Please confirm to proceed moving forward.',
    acceptClass: '!hidden',
    rejectClass: '!hidden',
  });
}
</script>

<template>
  <AddNewChat @click="confirm.close()" />

  <div class="flex flex-col pt-4 px-4 pb-3 gap-5">
    <div class="flex w-full justify-between items-center">
      <h1 class="font-bold text-lg">Chats</h1>
      <Button icon="pi pi-plus" aria-label="Chat" :class="theme.regularBtn" size="small" icon-class="!text-xs"
        @click="showTemplate($event)" />
    </div>
    <slot name="search"></slot>
  </div>

</template>
