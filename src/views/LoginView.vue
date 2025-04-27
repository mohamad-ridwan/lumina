<script setup>
import Button from 'primevue/button';
import { ref, watch } from 'vue';
import { zodResolver } from '@primevue/forms/resolvers/zod';
import { useToast } from "primevue/usetoast";
import { z } from 'zod';
import { InputText, Message } from 'primevue';
import { Form } from '@primevue/forms';
import AuthLayout from '@/layout/auth/AuthLayout.vue';
import { fetchLogin } from '@/services/api/users';
import { useRouter } from 'vue-router';
import { updateSessionLogin } from '@/storage-management/local-storage/session-login';
import AuthNavigation from '@/sections/auth/AuthNavigation.vue';

const toast = useToast();
const initialValues = ref({
  username: '',
  phoneNumber: '',
  password: ''
});
const loadingLogin = ref(false)
const loginFailedMessage = ref(null)

const resolver = ref(zodResolver(
  z.object({
    username: z.string().min(1, { message: 'Username is required.' }),
    phoneNumber: z.string().min(1, { message: 'Phone Number is required.' }),
    password: z.string().min(1, { message: 'Password is required.' })
  })
));

const router = useRouter()

const onFormSubmit = async ({ valid }) => {
  loginFailedMessage.value = null
  if (valid) {
    loadingLogin.value = true
    const loginResult = await fetchLogin(initialValues.value)
    if (loginResult?.isErr) {
      loginFailedMessage.value = loginResult.message
      toast.add({ severity: 'error', summary: loginResult.message, life: 3000 });
    } else {
      updateSessionLogin(loginResult.token)
      router.push('/')
      toast.add({ severity: 'success', summary: 'Login Successfully', life: 3000 })
    }

    loadingLogin.value = false
  }
};

watch(() => {
  if (initialValues.value.password) {
    loginFailedMessage.value = null
  }
})
</script>
<template>
  <AuthLayout title="Log in to your Account" desc="Welcome back to Lumina!">
    <template #form-side>
      <div class="card flex justify-center">
        <Form v-slot="$form" :resolver="resolver" :initialValues="initialValues" @submit="onFormSubmit"
          class="flex flex-col gap-4 w-full">
          <div class="flex flex-col gap-1">
            <InputText v-model="initialValues.username" name="username" type="text" placeholder="Username or email"
              fluid class="!text-sm font-[500]" />
            <Message v-if="$form.username?.invalid" severity="error" size="small" variant="simple">{{
              $form.username.error?.message }}</Message>
          </div>
          <div class="flex flex-col gap-1">
            <InputText v-model="initialValues.phoneNumber" name="phoneNumber" type="tel" placeholder="Phone Number"
              fluid class="!text-sm font-[500]" />
            <Message v-if="$form.phoneNumber?.invalid" severity="error" size="small" variant="simple">{{
              $form.phoneNumber.error?.message }}</Message>
          </div>
          <div class="flex flex-col gap-1">
            <InputText v-model="initialValues.password" name="password" type="password" placeholder="Password" fluid
              class="!text-sm font-[500]" />
            <Message v-if="$form.password?.invalid || loginFailedMessage" severity="error" size="small"
              variant="simple">{{
                $form.password.error?.message || loginFailedMessage }}</Message>
          </div>
          <Button type="submit" label="Log in" :disabled="loadingLogin" :loading="loadingLogin" />
          <AuthNavigation btn-name="Create an account" />
        </Form>
      </div>
    </template>
  </AuthLayout>
</template>

<style scoped></style>
