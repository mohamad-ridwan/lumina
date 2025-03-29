import { clientUrl } from '../apiBaseUrl'
import { fetchData } from '../fetchData'

export const fetchLogin = async (req) => {
  const result = await fetchData(`${clientUrl}/users/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(req),
  })

  return result
}
