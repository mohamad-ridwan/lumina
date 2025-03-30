import { clientUrl } from '../apiBaseUrl'
import { fetchData } from '../fetchData'

export const fetchChatRoom = async (req) => {
  const result = await fetchData(`${clientUrl}/chat-room`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(req),
  })

  return result
}
