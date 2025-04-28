import { createRouter, createWebHistory } from 'vue-router'
import ChatView from '../views/ChatView.vue'
import LoginView from '@/views/LoginView.vue'
import { middleware } from '@/middleware'
import { useToast } from 'primevue'
import RegisterView from '@/views/RegisterView.vue'
import RegisterVerificationView from '@/views/RegisterVerificationView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: ChatView,
      meta: { requiresAuth: true },
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { requiresAuth: true },
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
      meta: { requiresAuth: true },
    },
    {
      path: '/register/verification/:token',
      name: 'verification',
      component: RegisterVerificationView,
    },
  ],
})

// handle auth
router.beforeEach(async (to, from, next) => {
  if (!to.meta?.requiresAuth) {
    next()
  }
  const isValidAuth = await middleware(to.path)
  if (!isValidAuth?.isValidAuth && isValidAuth?.redirectPage) {
    if (isValidAuth.message) {
      router.options.showToast = isValidAuth.message
    }
    next(isValidAuth.redirectPage)
  } else if (isValidAuth.isValidAuth && isValidAuth.redirectPage) {
    next(isValidAuth.redirectPage)
  } else {
    next()
  }
})

router.afterEach((to, from, failure) => {
  const toast = useToast()
  if (router.options?.showToast) {
    toast.add({ severity: 'warn', summary: router.options.showToast, life: 5000 })
  }
})

export default router
