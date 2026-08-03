import { Link } from 'react-router-dom'
import { BrandMark } from './AuthIcons.jsx'

function AuthLayout({ children, ariaLabel, portalLabel = 'Cổng tài khoản', wide = false }) {
  return (
    <main className="auth-page">
      <div className="ambient" aria-hidden="true">
        <div className="ambient__glow ambient__glow--one" />
        <div className="ambient__glow ambient__glow--two" />
      </div>

      <section
        className={`auth-shell${wide ? ' auth-shell--wide' : ''}`}
        aria-label={ariaLabel}
      >
        <div className="brand-row">
          <Link className="brand" to="/" aria-label="Bàn Việt - Trang chủ">
            <BrandMark />
            <span className="brand__name">Bàn Việt</span>
          </Link>
          <span className="portal-label">{portalLabel}</span>
        </div>

        {children}
      </section>

      <p className="page-footnote">Bàn Việt · Trải nghiệm nhà hàng thuận tiện hơn</p>
    </main>
  )
}

export default AuthLayout
