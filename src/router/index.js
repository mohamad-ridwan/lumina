import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '@/views/LoginView.vue'
import { middleware } from '@/middleware'
import { useToast } from 'primevue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { requiresAuth: true },
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { requiresAuth: true },
    },
  ],
})

// handle auth
router.beforeEach(async (to, from, next) => {
  const isValidAuth = await middleware(to.path)
  if (to.meta.requiresAuth && !isValidAuth?.isValidAuth && isValidAuth?.redirectPage) {
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
