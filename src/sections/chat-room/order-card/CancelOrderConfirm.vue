<script setup>
import { fetchConfirmCancelOrder } from '@/services/api/chat-room'
import Button from 'primevue/button'
import { ref, toRefs } from 'vue'

const props = defineProps(['orderData', 'messageId', 'profileId', 'recipientId'])
const { orderData, messageId, profileId, recipientId } = toRefs(props)
const loading = ref(false)

const submitCancelOrder = async () => {
  if (loading.value || orderData.value?.isConfirmed) {
    return
  }
  loading.value = true
  await fetchConfirmCancelOrder({ messageId: messageId.value, profileId: profileId.value, recipientId: recipientId.value })
  loading.value = false
}
</script>

<template>
  <div class="rotate-180 flex justify-end pt-3 w-full">
    <Button :disabled="loading || orderData?.isConfirmed" label="Ya, Batalkan pesanan" class="!text-xs w-full" size="sm"
      severity="danger" @click="submitCancelOrder" />
  </div>
</template>
