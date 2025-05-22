<script setup>
import { InputText, Message, useToast } from 'primevue';
import { computed, ref, watch } from 'vue';
import { zodResolver } from '@primevue/forms/resolvers/zod';
import { z } from 'zod';
import { fetchUpdateProfile } from '@/services/api/users';
import { usersStore } from '@/stores/users';
import { storeToRefs } from 'pinia';
import { Form } from '@primevue/forms';

// users store
const userStore = usersStore()
const { profile } = storeToRefs(userStore)

const toast = useToast();
const initialValues = ref({
  username: profile.value?.data?.username || '',
});
const loadingUpdated = ref(false)
const updatedFailedMessage = ref(null)
const isFieldUpdated = ref(false)

const resolver = ref(zodResolver(
  z.object({
    username: z.string().min(1, { message: 'Username is required.' }),
  })
));

const onFormSubmit = async ({ valid }) => {
  if (initialValues.value.username === profile.value?.data?.username) {
    isFieldUpdated.value = false
    return
  }
  updatedFailedMessage.value = null
  if (valid) {
    loadingUpdated.value = true
    const profileUpdated = await fetchUpdateProfile({
      id: profile.value?.data?.id,
      username: initialValues.value.username,
    })
    if (profileUpdated?.isErr) {
      updatedFailedMessage.value = profileUpdated.message
      toast.add({ severity: 'error', summary: profileUpdated.message, life: 3000 });
    } else {
      toast.add({ severity: 'success', summary: profileUpdated.message, life: 3000 })
      profile.value.data.username = initialValues.value.username
      isFieldUpdated.value = false
    }

    loadingUpdated.value = false
  }
};

watch(() => {
  if (initialValues.value.username) {
    updatedFailedMessage.value = null
  }
})

const validateUpdated = computed(() => {
  if (isFieldUpdated.value && initialValues.value.username === profile.value?.data?.username) {
    return
  } else if (!isFieldUpdated.value) {
    return
  }
  if (loadingUpdated.value || !initialValues.value.username.trim()) return

  return true
})

const handleUpdated = () => {
  if (validateUpdated.value) {
    return
  }
  if (isFieldUpdated.value && initialValues.value.username === profile.value?.data?.username) {
    isFieldUpdated.value = false
    return
  } else if (!isFieldUpdated.value) {
    isFieldUpdated.value = true
    return
  }
  if (loadingUpdated.value || !initialValues.value.username.trim()) return

  loadingUpdated.value = true
  isFieldUpdated.value = false
}
</script>

<template>
  <Form v-slot="$form" :resolver="resolver" :initialValues="initialValues" @submit="onFormSubmit"
    class="flex flex-col gap-4 w-full">
    <div class="flex flex-col gap-3 p-3 bg-white">
      <label for="username" class="text-sm font-[500] text-gray-500 px-2.5">Your Name</label>
      <div class="flex flex-col gap-1">
        <div class="w-full relative items-center">
          <InputText v-model="initialValues.username" name="username" type="text" placeholder="Username" fluid
            :class="`!text-sm font-[500] ${loadingUpdated || !isFieldUpdated ? '!border-none !outline-none !shadow-none cursor-default' : ''}`"
            :readonly="loadingUpdated || !isFieldUpdated" />
          <button
            :class="`absolute right-2 top-1/2 -translate-y-1/2 ${loadingUpdated ? 'cursor-default' : 'cursor-pointer'} text-gray-500`"
            :type="validateUpdated ? 'submit' : 'button'" :disabled="$form.username?.invalid || loadingUpdated"
            @click="handleUpdated">
            <i v-if="loadingUpdated" class="pi pi-spin pi-spinner"></i>
            <i v-else-if="!loadingUpdated && !isFieldUpdated" class="pi pi-pencil"></i>
            <i v-else-if="!$form.username?.invalid" class="pi pi-check"></i>
            <i v-else class="pi pi-times"></i>
          </button>
        </div>
        <Message v-if="$form.username?.invalid" severity="error" size="small" variant="simple">{{
          $form.username.error?.message }}</Message>
      </div>
    </div>
  </Form>
</template>
