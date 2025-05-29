module.exports = {
  swDest: 'public/sw.js',
  globDirectory: 'public',
  globPatterns: ['**/*.{html,js,css,png,jpg,jpeg,svg,gif,webp}'],
  ignoreURLParametersMatching: [/./], // abaikan semua query param
  runtimeCaching: [
    // Caching untuk image same-origin
    {
      urlPattern: ({ request }) => request.destination === 'image',
      handler: 'CacheFirst',
      options: {
        cacheName: 'lumina-image-cache',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        },
      },
    },
    // Caching untuk gambar dari firebase storage
    {
      urlPattern: 'https://firebasestorage.googleapis.com/.*',
      handler: 'CacheFirst',
      options: {
        cacheName: 'firebase-image-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 hari
        },
        cacheableResponse: {
          statuses: [200],
        },
      },
    },
  ],
}
