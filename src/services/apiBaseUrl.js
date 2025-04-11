// export const clientUrl = 'http://localhost:4001'
// export const clientUrl = 'https://be-lumina.vercel.app'
export const clientUrl =
  import.meta.env.MODE === 'development'
    ? 'http://localhost:4001'
    : 'https://be-lumina-production.up.railway.app'
