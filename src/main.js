import './assets/main.css'
import 'primeicons/primeicons.css'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import { definePreset } from '@primeuix/themes'
import App from './App.vue'
import router from './router'
import { theme } from './assets/theme'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
import VueVirtualScroller from 'vue-virtual-scroller'

const MyPreset = definePreset(Aura, {
  // Kustomisasi tema Anda di sini
  // Contoh:
  // Tambahkan kustomisasi lainnya sesuai kebutuhan
  semantic: {
    primary: {
      50: '{blue.50}',
      100: '{blue.100}',
      200: '{blue.200}',
      300: '{blue.300}',
      400: '{blue.400}',
      500: '{blue.500}',
      600: '{blue.600}',
      700: '{blue.700}',
      800: '{blue.800}',
      900: '{blue.900}',
      950: '{blue.950}',
    },
    colorScheme: {
      light: {
        primary: {
          color: theme.primary.main,
          inverseColor: '#ffffff',
          hoverColor: theme.primary.hover,
          activeColor: theme.primary.active,
        },
      },
    },
  },
  components: {
    button: {
      info: {
        background: theme.primary.main,
      },
      secondary: {
        background: 'transparent !important',
        hover: {
          background: '#f1f1f1 !important',
        },
      },
    },
    inputtext: {
      focus: {
        border: {
          color: theme.primary.active,
        },
      },
      sm: {
        font: {
          size: '0.5rem',
        },
      },
      lg: {
        font: {
          size: '0.5rem',
        },
      },
    },
    message: {
      text: {
        fontSize: '0.7rem',
        sm: {
          fontSize: '0.7rem',
        },
        lg: {
          fontSize: '0.7rem',
        },
      },
    },
  },
})

const app = createApp(App)

app.use(PrimeVue, {
  theme: {
    preset: MyPreset,
    options: {
      darkModeSelector: false,
    },
  },
  ripple: true,
})
app.use(ToastService)
app.use(ConfirmationService)

app.use(createPinia())
app.use(VueVirtualScroller)
app.use(router)

app.mount('#app')

// main.js
// if ('serviceWorker' in navigator) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker.register('/sw.js').then(
//       (registration) => {
//         console.log('SW registered:', registration)
//       },
//       (err) => {
//         console.error('SW registration failed:', err)
//       },
//     )
//   })
// }
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Daftarkan service worker.
    // Path '/firebase-storage-sw.js' adalah lokasi file service worker Anda
    // relatif dari root aplikasi. 'scope: /' berarti service worker
    // mengontrol semua halaman di bawah root (seluruh aplikasi Anda).
    navigator.serviceWorker
      .register('/firebase-storage-sw.js', { scope: '/' })
      .then((registration) => {
        console.log('Service Worker registered with scope:', registration.scope)
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error)
      })
  })
}
