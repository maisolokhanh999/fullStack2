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

const request = async (path, options = {}, fallbackMessage) => {
  let response

  try {
    response = await fetch(`${API_BASE_URL}${path}`, options)
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
    throw error
  }

  return data
}

export const login = ({ email, password }) =>
  request(
    '/auth/login',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    },
    'Email hoặc mật khẩu không chính xác.',
  )

export const register = ({ name, email, password, phone, address }) =>
  request(
    '/auth/register',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim(),
        address: address.trim(),
      }),
    },
    'Không thể tạo tài khoản. Vui lòng kiểm tra thông tin và thử lại.',
  )

export const getMe = (token, signal) =>
  request(
    '/auth/me',
    {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    },
    'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  )
