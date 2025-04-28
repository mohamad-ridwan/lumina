<script setup>
import Button from 'primevue/button';
import { ref, watch } from 'vue';
import { zodResolver } from '@primevue/forms/resolvers/zod';
import { useToast } from "primevue/usetoast";
import { z } from 'zod';
import { InputText, Message } from 'primevue';
import { Form } from '@primevue/forms';
import AuthLayout from '@/layout/auth/AuthLayout.vue';
import { fetchAddVerifyRegister, fetchRegister } from '@/services/api/users';
import { useRouter } from 'vue-router';
import AuthNavigation from '@/sections/auth/AuthNavigation.vue';
import { emailSend } from '@/services/email/send';

const toast = useToast();
const initialValues = ref({
  email: '',
  username: '',
  phoneNumber: '',
  password: ''
});
const loadingRegister = ref(false)
const registerFailedMessage = ref(null)

const resolver = ref(zodResolver(
  z.object({
    email: z.string().min(1, { message: 'Email is required.' }),
    username: z.string().min(1, { message: 'Username is required.' }),
    phoneNumber: z.string().min(1, { message: 'Phone Number is required.' }),
    password: z.string().min(1, { message: 'Password is required.' })
  })
));

const router = useRouter()

const onFormSubmit = async ({ valid }) => {
  registerFailedMessage.value = null
  if (valid) {
    loadingRegister.value = true
    const registerResult = await fetchRegister(initialValues.value)
    if (registerResult?.isErr) {
      registerFailedMessage.value = registerResult.message
      toast.add({ severity: 'error', summary: registerResult.message, life: 3000 });
    } else {
      const resultAddVerify = await fetchAddVerifyRegister(registerResult?.data?.id)
      if (resultAddVerify?.isErr) {
        toast.add({ severity: 'error', summary: resultAddVerify.message, life: 3000 });
        return
      }
      emailSend({
        title: `Hi ${registerResult.data.username}!, please verify your Account`,
        company: 'Lumina',
        username: registerResult.data.username,
        email_user: registerResult.data.email,
        time: new Date(),
        message: `${resultAddVerify.data.tokenClient} is your Lumina Account verification token. Do not share the token`
      })

      router.push(`/register/verification/${resultAddVerify?.data?.token}`)
      toast.add({ severity: 'success', summary: 'Successful registration, please verify', life: 3000 })
    }

    loadingRegister.value = false
  }
};

watch(() => {
  if (initialValues.value.password) {
    registerFailedMessage.value = null
  }
})
</script>
<template>
  <AuthLayout title="Register your Account" desc="Register your Account until the verification stage!">
    <template #form-side>
      <div class="card flex justify-center">
        <Form v-slot="$form" :resolver="resolver" :initialValues="initialValues" @submit="onFormSubmit"
          class="flex flex-col gap-4 w-full">
          <div class="flex flex-col gap-1">
            <InputText v-model="initialValues.username" name="username" type="text" placeholder="Username" fluid
              class="!text-sm font-[500]" />
            <Message v-if="$form.username?.invalid" severity="error" size="small" variant="simple">{{
              $form.username.error?.message }}</Message>
          </div>
          <div class="flex flex-col gap-1">
            <InputText v-model="initialValues.email" name="email" type="text" placeholder="Email" fluid
              class="!text-sm font-[500]" />
            <Message v-if="$form.email?.invalid" severity="error" size="small" variant="simple">{{
              $form.email.error?.message }}</Message>
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
          <Button type="submit" label="Register" :disabled="loadingRegister" :loading="loadingRegister" />
          <AuthNavigation btn-name="Login" desc="Already have an Account?" path="/login" />
        </Form>
      </div>
    </template>
  </AuthLayout>
</template>

<style scoped></style>
