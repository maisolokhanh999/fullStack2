const TOKEN_KEY = 'token'
const USER_KEY = 'user'

export const getStoredToken = () =>
  localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY)

export const readStoredUser = () => {
  try {
    const rawUser = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY)
    return rawUser ? JSON.parse(rawUser) : null
  } catch {
    return null
  }
}

export const clearStoredSession = () => {
  ;[localStorage, sessionStorage].forEach((storage) => {
    storage.removeItem(TOKEN_KEY)
    storage.removeItem(USER_KEY)
  })
}

export const saveSession = ({ token, user, remember = true }) => {
  clearStoredSession()
  const storage = remember ? localStorage : sessionStorage
  storage.setItem(TOKEN_KEY, token)
  storage.setItem(USER_KEY, JSON.stringify(user))
}

export const updateStoredUser = (user) => {
  const storage = localStorage.getItem(TOKEN_KEY) ? localStorage : sessionStorage
  storage.setItem(USER_KEY, JSON.stringify(user))
}
