import { apiRequest } from './apiClient.js'

export const login = ({ email, password }) =>
  apiRequest(
    '/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    },
    'Email hoặc mật khẩu không chính xác.',
  )

export const register = ({ name, email, password, phone, address }) =>
  apiRequest(
    '/auth/register',
    {
      method: 'POST',
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
  apiRequest(
    '/auth/me',
    {
      auth: true,
      token,
      signal,
    },
    'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  )
