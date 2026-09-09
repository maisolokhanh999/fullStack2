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

        <div className={`bv-account-layout${wide ? ' bv-account-layout--wide' : ''}`}>
          <aside className="bv-account-intro"><p className="bv-eyebrow">Một chỗ ngồi thân quen</p><h2 className="bv-display">Hẹn nhau<br />bên bàn.</h2><p>Lưu những cuộc hẹn, chọn món yêu thích và chuẩn bị cho bữa ăn tiếp theo.</p><Link to="/#stories" className="bv-text-link">Chuyện quanh bàn ăn ↗</Link></aside>
        <section
          className={`auth-shell${wide ? ' auth-shell--wide' : ''}`}
          aria-label={ariaLabel}
        >
          {children}
        </section>
        </div>
      </main>

      <p className="page-footnote">Bàn Việt · Trải nghiệm nhà hàng thuận tiện hơn</p>
    </div>
  )
}

export default AuthLayout
