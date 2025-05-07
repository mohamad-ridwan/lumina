// workbox-config.js
module.exports = {
  globDirectory: 'dist/',
  globPatterns: ['**/*.{html,js,css,png,jpg,jpeg,svg,gif,webp}'],
  swDest: 'dist/sw.js',
  runtimeCaching: [
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
  ],
}
