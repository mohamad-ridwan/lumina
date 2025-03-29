export const sessionLoginStorageName = 'lumina-session'

export const getSessionLogin = () => {
  const token = localStorage.getItem(sessionLoginStorageName)
  if (!token) {
    return null
  }
  return token
}
export const updateSessionLogin = (token) => {
  localStorage.setItem(sessionLoginStorageName, token)
}
export const deleteSessionLogin = () => {
  localStorage.removeItem(sessionLoginStorageName)
}
