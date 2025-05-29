const CACHE_NAME = 'firebase-storage-cache-v3'

self.addEventListener('install', (event) => {
  console.log('[SW] Installed')
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  console.log('[SW] Activated')
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.map((name) => {
          if (name !== CACHE_NAME) return caches.delete(name)
        }),
      ),
    ),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request

  // Hanya cache request ke Firebase Storage
  const isFirebaseFile =
    req.method === 'GET' && req.url.includes('https://firebasestorage.googleapis.com/v0/b/')

  if (!isFirebaseFile) return

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) {
        console.log('[SW] From cache:', req.url)
        return cached
      }

      return fetch(req, { mode: 'no-cors' })
        .then((res) => {
          // Langsung cache response meskipun opaque
          return caches.open(CACHE_NAME).then((cache) => {
            try {
              cache.put(req, res.clone())
            } catch (err) {
              console.warn('[SW] ⚠️ Cannot cache opaque response:', err)
            }
            return res
          })
        })
        .catch((err) => {
          console.error('[SW] Network error:', err)
          return new Response('Offline or failed to fetch file.', {
            status: 504,
            statusText: 'Gateway Timeout',
          })
        })
    }),
  )
})
