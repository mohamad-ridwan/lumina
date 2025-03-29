export const sessionLoginStorageName = 'lumina-session'

export const getSessionLogin = () => {}
export const updateSessionLogin = (token) => {
  localStorage.setItem(sessionLoginStorageName, token)
}
export const deleteSessionLogin = () => {}
