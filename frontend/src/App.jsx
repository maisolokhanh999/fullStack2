import { useEffect, useState } from 'react'
import './App.css'

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'https://fullstack2-sdtf.onrender.com'
).replace(/\/+$/, '')

const getStoredToken = () =>
  localStorage.getItem('token') || sessionStorage.getItem('token')

const readStoredUser = () => {
  try {
    const rawUser = localStorage.getItem('user') || sessionStorage.getItem('user')
    return rawUser ? JSON.parse(rawUser) : null
  } catch {
    return null
  }
}

const clearStoredSession = () => {
  ;[localStorage, sessionStorage].forEach((storage) => {
    storage.removeItem('token')
    storage.removeItem('user')
  })
}

const getResponseData = async (response) => {
  try {
    return await response.json()
  } catch {
    return {}
  }
}

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <span>B</span>
      <i />
    </span>
  )
}

function GoogleMark() {
  return (
    <svg className="google-mark" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.06H12v3.9h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.32 2.98-7.4Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.63-2.43l-3.24-2.54c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.39 13.86A6.01 6.01 0 0 1 6.08 12c0-.65.11-1.28.31-1.86V7.52H3.04A10 10 0 0 0 2 12c0 1.61.39 3.14 1.04 4.48l3.35-2.62Z" />
      <path fill="#EA4335" d="M12 6.01c1.47 0 2.78.5 3.81 1.49l2.88-2.88A9.66 9.66 0 0 0 12 2a10 10 0 0 0-8.96 5.52l3.35 2.62C7.18 7.77 9.39 6 12 6.01Z" />
    </svg>
  )
}

function App() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [notice, setNotice] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [user, setUser] = useState(readStoredUser)
  const [isCheckingSession, setIsCheckingSession] = useState(Boolean(getStoredToken()))

  useEffect(() => {
    const token = getStoredToken()

    if (!token) {
      setIsCheckingSession(false)
      return
    }

    const controller = new AbortController()

    const verifySession = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })
        const data = await getResponseData(response)

        if (!response.ok) {
          throw new Error(data.message || 'Phiên đăng nhập đã hết hạn')
        }

        const storage = localStorage.getItem('token') ? localStorage : sessionStorage
        setUser(data.user)
        storage.setItem('user', JSON.stringify(data.user))
      } catch (error) {
        if (error.name !== 'AbortError') {
          clearStoredSession()
          setUser(null)
        }
      } finally {
        setIsCheckingSession(false)
      }
    }

    verifySession()
    return () => controller.abort()
  }, [])

  const updateField = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
    setSubmitError('')
  }

  const validate = () => {
    const nextErrors = {}
    const email = form.email.trim()

    if (!email) {
      nextErrors.email = 'Vui lòng nhập email.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = 'Email chưa đúng định dạng.'
    }

    if (!form.password) {
      nextErrors.password = 'Vui lòng nhập mật khẩu.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validate()) return

    setIsLoading(true)
    setSubmitError('')
    setNotice('')

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email.trim().toLowerCase(),
          password: form.password,
        }),
      })
      const data = await getResponseData(response)

      if (!response.ok) {
        throw new Error(data.message || 'Không thể đăng nhập. Vui lòng thử lại.')
      }

      clearStoredSession()
      const storage = rememberMe ? localStorage : sessionStorage
      storage.setItem('token', data.token)
      storage.setItem('user', JSON.stringify(data.user))
      setUser(data.user)
      setForm({ email: '', password: '' })
    } catch (error) {
      if (error instanceof TypeError) {
        setSubmitError('Không kết nối được máy chủ. Vui lòng kiểm tra mạng và thử lại.')
      } else {
        setSubmitError(error.message)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const showIntegrationNotice = (feature) => {
    const messages = {
      google: 'Đăng nhập Google cần được cấu hình OAuth ở backend. Hiện tại bạn hãy dùng email và mật khẩu.',
      password: 'Khôi phục mật khẩu cần được bổ sung ở backend. Vui lòng liên hệ quản lý hệ thống.',
      register: 'Đăng ký nhà hàng cần endpoint đăng ký từ backend. Form sẽ được mở ngay khi API sẵn sàng.',
    }

    setErrors({})
    setSubmitError('')
    setNotice(messages[feature])
  }

  const logout = () => {
    clearStoredSession()
    setUser(null)
  }

  return (
    <main className="auth-page">
      <div className="ambient" aria-hidden="true">
        <div className="ambient__glow ambient__glow--one" />
        <div className="ambient__glow ambient__glow--two" />
      </div>

      <section className="auth-shell" aria-label="Đăng nhập Bàn Việt">
        <div className="brand-row">
          <a className="brand" href="/" aria-label="Bàn Việt - Trang chủ">
            <BrandMark />
            <span className="brand__name">Bàn Việt</span>
          </a>
          <span className="portal-label">Cổng nội bộ</span>
        </div>

        {isCheckingSession ? (
          <div className="session-loading" role="status" aria-live="polite">
            <span className="spinner" aria-hidden="true" />
            <p>Đang kiểm tra phiên đăng nhập...</p>
          </div>
        ) : user ? (
          <div className="welcome-card">
            <span className="success-icon" aria-hidden="true">✓</span>
            <span className="section-label">Đã xác thực</span>
            <h1>Xin chào, {user.name}</h1>
            <p>
              Bạn đang sử dụng tài khoản <strong>{user.email}</strong>.
            </p>
            <dl className="account-details">
              <div>
                <dt>Vai trò</dt>
                <dd>{user.role || 'user'}</dd>
              </div>
              <div>
                <dt>Trạng thái</dt>
                <dd><span className="status-dot" /> Đang hoạt động</dd>
              </div>
            </dl>
            <button className="secondary-button" type="button" onClick={logout}>
              Đăng xuất
            </button>
          </div>
        ) : (
          <>
            <header className="form-heading">
              <span className="section-label">Quản lý &amp; nhân viên</span>
              <h1>Chào mừng trở lại</h1>
              <p>Đăng nhập để tiếp tục vận hành nhà hàng của bạn.</p>
            </header>

            <button
              type="button"
              className="google-button"
              onClick={() => showIntegrationNotice('google')}
            >
              <GoogleMark />
              <span>Tiếp tục với Google</span>
            </button>

            {notice && (
              <div className="form-notice" role="status">
                <span className="form-notice__icon" aria-hidden="true">i</span>
                <p>{notice}</p>
                <button type="button" onClick={() => setNotice('')} aria-label="Đóng thông báo">×</button>
              </div>
            )}

            <div className="auth-divider"><span>hoặc đăng nhập bằng email</span></div>

            <form className="login-form" onSubmit={handleSubmit} noValidate>
              <div className="field-group">
                <label htmlFor="email">Email công việc</label>
                <div className={`input-shell ${errors.email ? 'input-shell--error' : ''}`}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M3.5 6.5h17v12h-17z" />
                    <path d="m4 7 8 6 8-6" />
                  </svg>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@restaurant.com"
                    value={form.email}
                    onChange={updateField}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                  />
                </div>
                {errors.email && <span className="field-error" id="email-error">{errors.email}</span>}
              </div>

              <div className="field-group">
                <label htmlFor="password">Mật khẩu</label>
                <div className={`input-shell ${errors.password ? 'input-shell--error' : ''}`}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="5" y="10" width="14" height="10" rx="2" />
                    <path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10" />
                  </svg>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Nhập mật khẩu"
                    value={form.password}
                    onChange={updateField}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                  />
                  <button
                    className="password-toggle"
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? 'Ẩn' : 'Hiện'}
                  </button>
                </div>
                {errors.password && (
                  <span className="field-error" id="password-error">{errors.password}</span>
                )}
              </div>

              <div className="form-options">
                <label className="remember-option">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                  />
                  <span>Ghi nhớ đăng nhập</span>
                </label>
                <button type="button" className="text-button" onClick={() => showIntegrationNotice('password')}>
                  Quên mật khẩu?
                </button>
              </div>

              {submitError && (
                <div className="submit-error" role="alert">
                  <span aria-hidden="true">!</span>
                  {submitError}
                </div>
              )}

              <button className="primary-button" type="submit" disabled={isLoading}>
                {isLoading && <span className="spinner spinner--light" aria-hidden="true" />}
                <span>{isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}</span>
                {!isLoading && <span className="button-arrow" aria-hidden="true">↗</span>}
              </button>
            </form>

            <p className="register-note">
              Bạn là chủ nhà hàng?{' '}
              <button type="button" onClick={() => showIntegrationNotice('register')}>
                Đăng ký nhà hàng
              </button>
            </p>
          </>
        )}
      </section>

      <p className="page-footnote">Bàn Việt · Cổng vận hành nhà hàng</p>
    </main>
  )
}

export default App
