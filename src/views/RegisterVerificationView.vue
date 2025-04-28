<script setup>
import { useRoute, useRouter } from 'vue-router'
import { InputOtp, Message, useToast } from 'primevue';
import { ref } from 'vue';
import AuthLayout from '@/layout/auth/AuthLayout.vue';
import AuthNavigation from '@/sections/auth/AuthNavigation.vue';
import { fetchRegisterVerification } from '@/services/api/users';

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
      <div class="card flex justify-center">
        <div class="flex flex-col gap-4 w-full">
          <div class="flex flex-col gap-1">
            <InputOtp name="tokenClient" class="!text-sm font-[500]" integerOnly @change="changeInput" />
            <Message v-if="errMessage" severity="error" size="small" variant="simple">{{
              errMessage }}</Message>
          </div>
          <AuthNavigation btn-name="Login" desc="Already have an Account?" path="/login" />
        </div>
      </div>
    </template>
  </AuthLayout>
</template>
