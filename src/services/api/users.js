import { clientUrl } from '../apiBaseUrl'
import { fetchData } from '../fetchData'

export const fetchUpdateProfile = async (req) => {
  const result = await fetchData(`${clientUrl}/users/update-profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(req),
  })

  return result
}

export const fetchRegisterVerification = async (req) => {
  const result = await fetchData(`${clientUrl}/register-verify/verification`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(req),
  })

  return result
}

export const fetchAddVerifyRegister = async (userId) => {
  const result = await fetchData(
    `${clientUrl}/register-verify/add-verify-register?userId=${userId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  )

  return result
}

export const fetchRegister = async (req) => {
  const result = await fetchData(`${clientUrl}/users/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(req),
  })

  return result
}

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
