<script setup>
import Button from 'primevue/button';

import { ref } from 'vue';
import { zodResolver } from '@primevue/forms/resolvers/zod';
import { useToast } from "primevue/usetoast";
import { z } from 'zod';
import { InputText, Message } from 'primevue';
import { Form } from '@primevue/forms';
import AuthLayout from '@/layout/auth/AuthLayout.vue';

const toast = useToast();
const initialValues = ref({
  username: '',
  phoneNumber: '',
  password: ''
});

const resolver = ref(zodResolver(
  z.object({
    username: z.string().min(1, { message: 'Username is required.' }),
    phoneNumber: z.string().min(1, { message: 'Phone Number is required.' }),
    password: z.string().min(1, { message: 'Password is required.' })
  })
));

const onFormSubmit = ({ valid }) => {
  if (valid) {
    toast.add({ severity: 'success', summary: 'Form is submitted.', life: 3000 });
  }
};
</script>
<template>
  <AuthLayout title="Log in to your Account" desc="Welcome back to RuangSapa!">
    <template #form-side>
      <div class="card flex justify-center">
        <Form v-slot="$form" :resolver="resolver" :initialValues="initialValues" @submit="onFormSubmit"
          class="flex flex-col gap-4 w-full">
          <div class="flex flex-col gap-1">
            <InputText name="username" type="text" placeholder="Username or email" fluid class="!text-sm font-[500]" />
            <Message v-if="$form.username?.invalid" severity="error" size="small" variant="simple">{{
              $form.username.error?.message }}</Message>
          </div>
          <div class="flex flex-col gap-1">
            <InputText name="phoneNumber" type="tel" placeholder="Phone Number" fluid class="!text-sm font-[500]" />
            <Message v-if="$form.phoneNumber?.invalid" severity="error" size="small" variant="simple">{{
              $form.phoneNumber.error?.message }}</Message>
          </div>
          <div class="flex flex-col gap-1">
            <InputText name="password" type="text" placeholder="Password" fluid class="!text-sm font-[500]" />
            <Message v-if="$form.password?.invalid" severity="error" size="small" variant="simple">{{
              $form.password.error?.message }}</Message>
          </div>
          <Button type="submit" label="Log in" />
        </Form>
      </div>
    </template>
  </AuthLayout>
</template>

<style scoped></style>
