import { getStoredToken } from '../utils/authStorage.js'

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'https://fullstack2-sdtf.onrender.com'
).replace(/\/+$/, '')

const readJson = async (response) => {
  try {
    return await response.json()
  } catch {
    return {}
  }
}

const looksLikeBrokenEncoding = (message) =>
  typeof message === 'string' && /Ã|Ä|Æ|áº|á»|Â/.test(message)

export async function apiRequest(
  path,
  { auth = false, token: explicitToken, headers: inputHeaders, ...options } = {},
  fallbackMessage = 'Không thể xử lý yêu cầu. Vui lòng thử lại.',
) {
  const headers = new Headers(inputHeaders)
  const token = explicitToken || (auth ? getStoredToken() : '')

  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  let response

  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new Error('Không kết nối được máy chủ. Vui lòng kiểm tra mạng và thử lại.')
  }

  const data = await readJson(response)

  if (!response.ok) {
    const apiMessage = data?.message
    const error = new Error(
      apiMessage && !looksLikeBrokenEncoding(apiMessage) ? apiMessage : fallbackMessage,
    )
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}
