import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout.jsx'
import { FieldIcon, GoogleMark } from '../components/AuthIcons.jsx'
import { login } from '../services/authService.js'
import { getStoredToken, saveSession } from '../utils/authStorage.js'

const initialForm = { email: '', password: '' }

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [notice, setNotice] = useState(
    location.state?.sessionExpired ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' : '',
  )
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)

  useEffect(() => {
    if (getStoredToken()) navigate('/dashboard', { replace: true })
  }, [navigate])

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

    if (!form.password) nextErrors.password = 'Vui lòng nhập mật khẩu.'

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
      const data = await login(form)
      saveSession({ token: data.token, user: data.user, remember: rememberMe })
      const nextPath = location.state?.from?.pathname || '/dashboard'
      navigate(nextPath, { replace: true })
    } catch (error) {
      setSubmitError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const showIntegrationNotice = (feature) => {
    const messages = {
      google: 'Đăng nhập Google cần được cấu hình OAuth ở backend. Hiện tại bạn hãy dùng email và mật khẩu.',
      password: 'Khôi phục mật khẩu chưa được backend hỗ trợ. Vui lòng liên hệ quản trị viên.',
    }

    setErrors({})
    setSubmitError('')
    setNotice(messages[feature])
  }

  return (
    <AuthLayout ariaLabel="Đăng nhập Bàn Việt">
      <header className="form-heading">
        <span className="section-label">Cổng tài khoản Bàn Việt</span>
        <h1>Chào mừng trở lại</h1>
        <p>Đăng nhập để đặt bàn hoặc tiếp tục công việc tại nhà hàng.</p>
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

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="field-group">
          <label htmlFor="login-email">Email</label>
          <div className={`input-shell ${errors.email ? 'input-shell--error' : ''}`}>
            <FieldIcon type="email" />
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="name@restaurant.com"
              value={form.email}
              onChange={updateField}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'login-email-error' : undefined}
            />
          </div>
          {errors.email && <span className="field-error" id="login-email-error">{errors.email}</span>}
        </div>

        <div className="field-group">
          <label htmlFor="login-password">Mật khẩu</label>
          <div className={`input-shell ${errors.password ? 'input-shell--error' : ''}`}>
            <FieldIcon type="password" />
            <input
              id="login-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Nhập mật khẩu"
              value={form.password}
              onChange={updateField}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? 'login-password-error' : undefined}
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
            <span className="field-error" id="login-password-error">{errors.password}</span>
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
        Chưa có tài khoản? <Link to="/register">Tạo tài khoản</Link>
      </p>
    </AuthLayout>
  )
}

export default LoginPage
