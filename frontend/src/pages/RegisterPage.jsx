import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout.jsx'
import { FieldIcon } from '../components/AuthIcons.jsx'
import { register } from '../services/authService.js'
import { getStoredToken, saveSession } from '../utils/authStorage.js'

const initialForm = {
  name: '',
  email: '',
  phone: '',
  address: '',
  password: '',
  confirmPassword: '',
}

function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (getStoredToken()) navigate('/dashboard', { replace: true })
  }, [navigate])

  const updateField = (event) => {
    const { name } = event.target
    const value = name === 'phone'
      ? event.target.value.replace(/\D/g, '').slice(0, 10)
      : event.target.value

    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
    setSubmitError('')
  }

  const validate = () => {
    const nextErrors = {}
    const email = form.email.trim()

    if (!form.name.trim()) nextErrors.name = 'Vui lòng nhập họ và tên.'
    if (!email) {
      nextErrors.email = 'Vui lòng nhập email.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = 'Email chưa đúng định dạng.'
    }
    if (!/^\d{9,10}$/.test(form.phone)) {
      nextErrors.phone = 'Số điện thoại cần có 9 đến 10 chữ số.'
    }
    if (!form.address.trim()) nextErrors.address = 'Vui lòng nhập địa chỉ.'
    if (form.password.length < 6) {
      nextErrors.password = 'Mật khẩu cần có ít nhất 6 ký tự.'
    }
    if (!form.confirmPassword) {
      nextErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu.'
    } else if (form.confirmPassword !== form.password) {
      nextErrors.confirmPassword = 'Mật khẩu xác nhận chưa khớp.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validate()) return

    setIsLoading(true)
    setSubmitError('')

    try {
      const data = await register(form)
      saveSession({ token: data.token, user: data.user, remember: true })
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setSubmitError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const fields = [
    { name: 'name', label: 'Họ và tên', type: 'text', autoComplete: 'name', placeholder: 'Nguyễn Văn An', icon: 'user' },
    { name: 'email', label: 'Email', type: 'email', autoComplete: 'email', placeholder: 'ban@example.com', icon: 'email' },
    { name: 'phone', label: 'Số điện thoại', type: 'tel', autoComplete: 'tel', placeholder: '0901234567', icon: 'phone', inputMode: 'numeric' },
    { name: 'address', label: 'Địa chỉ', type: 'text', autoComplete: 'street-address', placeholder: 'Quận 1, TP. Hồ Chí Minh', icon: 'address' },
  ]

  return (
    <AuthLayout ariaLabel="Tạo tài khoản Bàn Việt" portalLabel="Tài khoản mới" wide>
      <header className="form-heading form-heading--register">
        <span className="section-label">Bắt đầu với Bàn Việt</span>
        <h1>Tạo tài khoản</h1>
        <p>Đăng ký để xem nhà hàng, đặt bàn và gọi món thuận tiện hơn.</p>
      </header>

      <div className="role-note">
        <span aria-hidden="true">i</span>
        <p>Tài khoản quản lý và nhân viên sẽ được hệ thống cấp quyền riêng.</p>
      </div>

      <form className="auth-form register-form" onSubmit={handleSubmit} noValidate>
        <div className="register-grid">
          {fields.map((field) => (
            <div className={`field-group field-group--${field.name}`} key={field.name}>
              <label htmlFor={`register-${field.name}`}>{field.label}</label>
              <div className={`input-shell ${errors[field.name] ? 'input-shell--error' : ''}`}>
                <FieldIcon type={field.icon} />
                <input
                  id={`register-${field.name}`}
                  name={field.name}
                  type={field.type}
                  autoComplete={field.autoComplete}
                  inputMode={field.inputMode}
                  placeholder={field.placeholder}
                  value={form[field.name]}
                  onChange={updateField}
                  aria-invalid={Boolean(errors[field.name])}
                  aria-describedby={errors[field.name] ? `register-${field.name}-error` : undefined}
                />
              </div>
              {errors[field.name] && (
                <span className="field-error" id={`register-${field.name}-error`}>
                  {errors[field.name]}
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="register-grid">
          <div className="field-group">
            <label htmlFor="register-password">Mật khẩu</label>
            <div className={`input-shell ${errors.password ? 'input-shell--error' : ''}`}>
              <FieldIcon type="password" />
              <input
                id="register-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Tối thiểu 6 ký tự"
                value={form.password}
                onChange={updateField}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? 'register-password-error' : undefined}
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
            {errors.password && <span className="field-error" id="register-password-error">{errors.password}</span>}
          </div>

          <div className="field-group">
            <label htmlFor="register-confirm-password">Xác nhận mật khẩu</label>
            <div className={`input-shell ${errors.confirmPassword ? 'input-shell--error' : ''}`}>
              <FieldIcon type="password" />
              <input
                id="register-confirm-password"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Nhập lại mật khẩu"
                value={form.confirmPassword}
                onChange={updateField}
                aria-invalid={Boolean(errors.confirmPassword)}
                aria-describedby={errors.confirmPassword ? 'register-confirm-password-error' : undefined}
              />
            </div>
            {errors.confirmPassword && (
              <span className="field-error" id="register-confirm-password-error">{errors.confirmPassword}</span>
            )}
          </div>
        </div>

        {submitError && (
          <div className="submit-error" role="alert">
            <span aria-hidden="true">!</span>
            {submitError}
          </div>
        )}

        <button className="primary-button" type="submit" disabled={isLoading}>
          {isLoading && <span className="spinner spinner--light" aria-hidden="true" />}
          <span>{isLoading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}</span>
          {!isLoading && <span className="button-arrow" aria-hidden="true">↗</span>}
        </button>
      </form>

      <p className="register-note">
        Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
      </p>
    </AuthLayout>
  )
}

export default RegisterPage
