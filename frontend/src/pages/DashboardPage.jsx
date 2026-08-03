import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { getLandingPath, isStaffRole } from '../utils/roleNavigation.js'

const roleLabels = {
  admin: 'Quản lý',
  staff: 'Nhân viên',
  user: 'Khách hàng',
}

const statusLabels = {
  Active: 'Đang hoạt động',
  Inactive: 'Chưa kích hoạt',
  Blocked: 'Đã khóa',
}

function DashboardPage() {
  const navigate = useNavigate()
  const {
    user,
    isLoading,
    verificationError: error,
    retryVerification,
    endSession,
  } = useAuth()

  const logout = () => {
    endSession()
    navigate('/login', { replace: true })
  }

  const accountStatus = user?.status || 'Active'
  const statusClass = accountStatus.toLowerCase()

  return (
    <AuthLayout ariaLabel="Tài khoản Bàn Việt" portalLabel="Tài khoản">
      {isLoading ? (
        <div className="session-loading" role="status" aria-live="polite">
          <span className="spinner" aria-hidden="true" />
          <p>Đang kiểm tra phiên đăng nhập...</p>
        </div>
      ) : error ? (
        <div className="welcome-card verification-error-card">
          <span className="error-state-icon" aria-hidden="true">!</span>
          <span className="section-label">Chưa thể xác minh phiên</span>
          <h1>Kết nối chưa ổn định</h1>
          <p>{error}</p>
          <div className="dashboard-actions">
            <button className="primary-button" type="button" onClick={retryVerification}>
              Thử lại
            </button>
            <button className="secondary-button" type="button" onClick={logout}>
              Đăng xuất
            </button>
          </div>
        </div>
      ) : (
        <div className="welcome-card">
          <span className="success-icon" aria-hidden="true">✓</span>
          <span className="section-label">Đã xác thực</span>
          <h1>Xin chào, {user?.name || 'bạn'}</h1>
          <p>
            Bạn đang sử dụng tài khoản <strong>{user?.email}</strong>.
          </p>

          <dl className="account-details">
            <div>
              <dt>Vai trò</dt>
              <dd>{roleLabels[user?.role] || user?.role || 'Khách hàng'}</dd>
            </div>
            <div>
              <dt>Trạng thái</dt>
              <dd>
                <span className={`status-dot status-dot--${statusClass}`} />
                {statusLabels[accountStatus] || accountStatus}
              </dd>
            </div>
          </dl>
          <Link className="primary-button link-button" to={getLandingPath(user)}>
            {isStaffRole(user?.role) ? 'Mở màn hình check-in' : 'Khám phá nhà hàng'}
            <span className="button-arrow" aria-hidden="true">↗</span>
          </Link>
          <button className="secondary-button" type="button" onClick={logout}>
            Đăng xuất
          </button>
        </div>
      )}
    </AuthLayout>
  )
}

export default DashboardPage
