// public/sw.js
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js')

workbox.routing.registerRoute(
  ({ request }) => request.destination === 'image',
  new workbox.strategies.CacheFirst({
    cacheName: 'image-cache',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 hari
      }),
    ],
  }),
)
