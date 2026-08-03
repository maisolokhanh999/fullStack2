import { Navigate, Outlet, useLocation } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout.jsx'
import { useAuth } from '../hooks/useAuth.js'

function ProtectedRoute() {
  const location = useLocation()
  const {
    user,
    isLoading,
    verificationError,
    sessionExpired,
    retryVerification,
    endSession,
  } = useAuth()

  if (isLoading) {
    return (
      <AuthLayout ariaLabel="Kiểm tra phiên đăng nhập" portalLabel="Tài khoản">
        <div className="session-loading" role="status" aria-live="polite">
          <span className="spinner" aria-hidden="true" />
          <p>Đang kiểm tra phiên đăng nhập...</p>
        </div>
      </AuthLayout>
    )
  }

  if (verificationError) {
    return (
      <AuthLayout ariaLabel="Không thể kiểm tra phiên đăng nhập" portalLabel="Tài khoản">
        <div className="welcome-card verification-error-card" role="alert">
          <span className="error-state-icon" aria-hidden="true">!</span>
          <span className="section-label">Chưa thể xác minh phiên</span>
          <h1>Kết nối chưa ổn định</h1>
          <p>{verificationError}</p>
          <div className="dashboard-actions">
            <button className="primary-button" type="button" onClick={retryVerification}>
              Thử lại
            </button>
            <button className="secondary-button" type="button" onClick={endSession}>
              Đăng xuất
            </button>
          </div>
        </div>
      </AuthLayout>
    )
  }

  if (!user) {
    const from = {
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
    }

    return (
      <Navigate
        to="/login"
        replace
        state={{ from, sessionExpired }}
      />
    )
  }

  return <Outlet />
}

export default ProtectedRoute
