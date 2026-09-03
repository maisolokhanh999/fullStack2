import { useEffect, useId, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { BrandMark } from '../AuthIcons.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { isAdminRole, isStaffRole } from '../../utils/roleNavigation.js'
import SiteFooter from './SiteFooter.jsx'
import SiteHeader from './SiteHeader.jsx'

function CustomerLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, endSession } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuId = useId()

  // Đóng bảng điều hướng khi đã chuyển trang, nếu không nó che nội dung mới.
  useEffect(() => setIsMenuOpen(false), [location.pathname])

  useEffect(() => {
    if (!isMenuOpen) return undefined

    const onKeyDown = (event) => {
      if (event.key === 'Escape') setIsMenuOpen(false)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isMenuOpen])

  const logout = () => {
    endSession()
    navigate('/login', { replace: true })
  }

  const links = [
    { to: '/', label: 'Trang chủ', end: true },
    { to: '/restaurants', label: 'Nhà hàng', end: true },
    { to: '/bookings', label: 'Đặt bàn' },
    ...(isStaffRole(user?.role) ? [{ to: '/staff/check-in', label: 'Check-in' }] : []),
    ...(isAdminRole(user?.role) ? [{ to: '/admin', label: 'Quản trị' }] : []),
  ]

  return (
    <div className="customer-app">
      <SiteHeader isOpen={isMenuOpen}>
        <div className="site-header__inner">
          <div className="site-header__lead">
            <NavLink className="site-brand" to="/" aria-label="Bàn Việt - Trang chủ">
              <BrandMark />
              <span>Bàn Việt</span>
            </NavLink>

            <nav className="site-nav" aria-label="Điều hướng chính">
              {links.map((link) => (
                <NavLink key={link.to} to={link.to} end={link.end}>{link.label}</NavLink>
              ))}
            </nav>
          </div>

          <div className="site-account">
            <NavLink to="/dashboard" className="site-account__name">
              {user?.name || 'Tài khoản'}
            </NavLink>
            <button type="button" onClick={logout}>Đăng xuất</button>
          </div>

          <button
            type="button"
            className="site-menu-toggle"
            aria-expanded={isMenuOpen}
            aria-controls={menuId}
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            {isMenuOpen ? 'Đóng' : 'Menu'}
          </button>
        </div>

        <div className="site-menu" id={menuId} hidden={!isMenuOpen}>
          <nav className="site-menu__nav" aria-label="Điều hướng chính, bản thu gọn">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end}>{link.label}</NavLink>
            ))}
          </nav>
          <div className="site-menu__account">
            <NavLink to="/dashboard">{user?.name || 'Tài khoản'}</NavLink>
            <button type="button" onClick={logout}>Đăng xuất</button>
          </div>
        </div>
      </SiteHeader>

      <Outlet />

      <SiteFooter />

    </div>
  )
}

export default CustomerLayout
