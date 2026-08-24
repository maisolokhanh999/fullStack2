import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { BrandMark } from '../AuthIcons.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { DEFAULT_RESTAURANT } from '../../config/restaurant.js'
import { isAdminRole, isStaffRole } from '../../utils/roleNavigation.js'

function CustomerLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, endSession } = useAuth()

  // "Hóa đơn của tôi" mở modal trên cùng route /restaurants thay vì có path
  // riêng, nên NavLink mặc định (chỉ so khớp pathname, bỏ qua state/hash) sẽ
  // luôn tô sáng cả "Nhà hàng" lẫn "Hóa đơn của tôi" cùng lúc. Tự tính active
  // theo đúng ý nghĩa: có đang mở modal hóa đơn hay không.
  const isInvoiceView = location.hash === '#my-invoices' || Boolean(location.state?.openInvoices)

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
            <NavLink
              to="/restaurants"
              className={({ isActive }) => (isActive && !isInvoiceView ? 'active' : undefined)}
            >
              Nhà hàng
            </NavLink>
            <NavLink to="/bookings">Đặt bàn của tôi</NavLink>
            <NavLink
              className={() => (isInvoiceView ? 'site-nav__invoice-button active' : 'site-nav__invoice-button')}
              to="/restaurants"
              state={{ openInvoices: true }}
            >
              Hóa đơn của tôi
            </NavLink>
            {isStaffRole(user?.role) && <NavLink to="/staff/check-in">Check-in</NavLink>}
            {isAdminRole(user?.role) && <NavLink to="/admin">Quản trị</NavLink>}
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
        <div className="site-footer__grid">
          <div className="site-footer__brand">
            <span className="site-footer__logo"><BrandMark />Bàn Việt</span>
            <p>Đặt bàn trước, tận hưởng trọn vẹn khi đến nơi.</p>
          </div>

          <nav className="site-footer__col" aria-label="Khám phá">
            <span>Khám phá</span>
            <NavLink to="/restaurants">Nhà hàng</NavLink>
            <NavLink to="/bookings">Đặt bàn của tôi</NavLink>
            <NavLink to="/restaurants" state={{ openInvoices: true }}>Hóa đơn của tôi</NavLink>
          </nav>

          <div className="site-footer__col">
            <span>Thông tin</span>
            <p>Giờ phục vụ: {DEFAULT_RESTAURANT.hours}</p>
            <p>Địa chỉ: {DEFAULT_RESTAURANT.address}</p>
          </div>
        </div>
        <div className="site-footer__bottom">
          <p>© {new Date().getFullYear()} Bàn Việt. Mọi thông tin trên trang chỉ mang tính minh hoạ cho bản dùng thử.</p>
        </div>
      </footer>
    </div>
  )
}

export default CustomerLayout
