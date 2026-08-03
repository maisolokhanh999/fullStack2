import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { BrandMark } from '../AuthIcons.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { isStaffRole } from '../../utils/roleNavigation.js'

function CustomerLayout() {
  const navigate = useNavigate()
  const { user, endSession } = useAuth()

  const logout = () => {
    endSession()
    navigate('/login', { replace: true })
  }

  return (
    <div className="customer-app">
      <header className="site-header">
        <div className="site-header__inner">
          <NavLink className="site-brand" to="/restaurants" aria-label="Bàn Việt - Nhà hàng">
            <BrandMark />
            <span>Bàn Việt</span>
          </NavLink>

          <nav className="site-nav" aria-label="Điều hướng chính">
            <NavLink to="/restaurants">Nhà hàng</NavLink>
            <NavLink to="/bookings">Đặt bàn của tôi</NavLink>
            {isStaffRole(user?.role) && <NavLink to="/staff/check-in">Check-in</NavLink>}
          </nav>

          <div className="site-account">
            <NavLink to="/dashboard" className="site-account__name">
              {user?.name || 'Tài khoản'}
            </NavLink>
            <button type="button" onClick={logout}>Đăng xuất</button>
          </div>
        </div>
      </header>

      <Outlet />

      <footer className="site-footer">
        <span>Bàn Việt</span>
        <p>Đặt bàn trước, tận hưởng trọn vẹn khi đến nơi.</p>
      </footer>
    </div>
  )
}

export default CustomerLayout
