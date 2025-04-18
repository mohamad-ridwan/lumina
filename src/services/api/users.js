import { clientUrl } from '../apiBaseUrl'
import { fetchData } from '../fetchData'

export const fetchSearchUsers = async (req) => {
  const result = await fetchData(`${clientUrl}/users/search-users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(req),
  })

  return result
}

export const fetchProfile = async (req) => {
  const result = await fetchData(`${clientUrl}/users/profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(req),
  })

  return result
}

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
