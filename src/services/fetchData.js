export async function fetchData(url, options = {}) {
  try {
    const response = await fetch(url, options)
    if (!response.ok) {
      return {
        isErr: true,
        ...(await response.json()),
        status: response.status,
      }
    }
    const data = await response.json()
    return data
  } catch (error) {
    return {
      isErr: true,
      message: 'A server error has occurred. Please try again.',
    } // Melemparkan kesalahan agar dapat ditangani di tempat lain
  }
}
