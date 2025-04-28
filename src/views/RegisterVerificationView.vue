<script setup>
import { useRoute, useRouter } from 'vue-router'
import { InputOtp, Message, useToast } from 'primevue';
import { ref } from 'vue';
import AuthLayout from '@/layout/auth/AuthLayout.vue';
import AuthNavigation from '@/sections/auth/AuthNavigation.vue';
import { fetchRegisterVerification } from '@/services/api/users';
import { theme } from '@/assets/theme';

const toast = useToast();

const loadingVerification = ref(false)
const errMessage = ref('')

const route = useRoute()
const router = useRouter()

const token = route.params.token

const onFormSubmit = async (tokenClient) => {
  const result = await fetchRegisterVerification({
    token,
    tokenClient
  })
  if (result?.isErr) {
    errMessage.value = result.message
  } else {
    router.push('/login')
    toast.add({ severity: 'success', summary: result.message, life: 3000 })
  }
  loadingVerification.value = false
}

const changeInput = (e) => {
  if (loadingVerification.value || e.value.length !== 4) {
    errMessage.value = 'Token is required.'
    return
  }
  loadingVerification.value = true
  errMessage.value = null
  onFormSubmit(e.value)
}

</script>

<template>
  <AuthLayout title="Account Verification" desc="Please check your email to enter the token!">
    <template #form-side>
      <div class="flex justify-center flex-col gap-3">
        <div class="w-fit bg-white shadow-md rounded-lg p-8 flex flex-col gap-6">
          <h1 :class="`text-xs text-[${theme.secondary.main}]`">Enter 4 digit token</h1>
          <div class="flex flex-col gap-2">
            <InputOtp name="tokenClient" class="!text-sm font-[500]" integer-only @change="changeInput" />
            <Message v-if="errMessage" severity="error" size="small" variant="simple">
              {{ errMessage }}
            </Message>
          </div>
        </div>
        <AuthNavigation btn-name="Login" desc="Already have an account?" path="/login" justify="justify-start" />
      </div>
    </template>
  </AuthLayout>
</template>
