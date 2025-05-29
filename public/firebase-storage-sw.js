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

const METADATA_CACHE = 'firebase-metadata-cache'
const MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000 // 7 hari

self.addEventListener('fetch', (event) => {
  const req = event.request

  const isFirebaseFile =
    req.method === 'GET' && req.url.includes('https://firebasestorage.googleapis.com/v0/b/')

  if (!isFirebaseFile) return

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(req)
      const metadataCache = await caches.open(METADATA_CACHE)
      const metadataKey = new Request(req.url + '__meta')

      if (cachedResponse) {
        const metaResponse = await metadataCache.match(metadataKey)
        if (metaResponse) {
          try {
            const { cachedAt } = await metaResponse.json()
            const isExpired = Date.now() - cachedAt > MAX_CACHE_AGE

            if (!isExpired) {
              console.log('[SW] ✅ Serve from cache (fresh):', req.url)
              return cachedResponse
            }

            console.log('[SW] ⚠️ Cache expired, re-fetching:', req.url)
          } catch (err) {
            console.warn('[SW] ⚠️ Invalid metadata:', err)
          }
        } else {
          console.log('[SW] ⚠️ No metadata, re-fetching:', req.url)
        }
      }

      try {
        const networkResponse = await fetch(req)

        cache.put(req, networkResponse.clone())

        // Simpan waktu cache sekarang
        await metadataCache.put(
          metadataKey,
          new Response(JSON.stringify({ cachedAt: Date.now() }), {
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        console.log('[SW] ✅ Fetched and cached:', req.url)
        return networkResponse
      } catch (err) {
        console.error('[SW] ❌ Network error:', err)

        if (cachedResponse) {
          console.warn('[SW] ⚠️ Serving expired cache due to network error:', req.url)
          return cachedResponse
        }

        return new Response('Offline or failed to fetch file.', {
          status: 504,
          statusText: 'Gateway Timeout',
        })
      }
    }),
  )
})
