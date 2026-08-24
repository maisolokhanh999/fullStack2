import { Link } from 'react-router-dom'
import { BrandMark } from './AuthIcons.jsx'

function AuthLayout({ children, ariaLabel, portalLabel = 'Cổng tài khoản', wide = false }) {
  return (
    <div className="auth-app">
      {/* Cùng một dải sơn mài như cổng khách, nhân viên và quản trị */}
      <header className="site-header">
        <div className="site-header__inner">
          <Link className="site-brand" to="/" aria-label="Bàn Việt - Trang chủ">
            <BrandMark />
            <span>Bàn Việt</span>
          </Link>
          <span className="portal-label">{portalLabel}</span>
        </div>
      </header>

      <main className="auth-page">
        <div className="ambient" aria-hidden="true">
          <div className="ambient__glow ambient__glow--one" />
          <div className="ambient__glow ambient__glow--two" />
        </div>

        <section
          className={`auth-shell${wide ? ' auth-shell--wide' : ''}`}
          aria-label={ariaLabel}
        >
          {children}
        </section>
      </main>

      <p className="page-footnote">Bàn Việt · Trải nghiệm nhà hàng thuận tiện hơn</p>
    </div>
  )
}

export default AuthLayout
