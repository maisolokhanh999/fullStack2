import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BrandMark } from '../components/AuthIcons.jsx'
import UiIcon from '../components/UiIcon.jsx'
import { useAuth } from '../hooks/useAuth.js'

function StaffCheckInPage() {
  const navigate = useNavigate()
  const { user, endSession } = useAuth()
  const [query, setQuery] = useState('')

  const logout = () => {
    endSession()
    navigate('/login', { replace: true })
  }

  return (
    <div className="staff-app">
      <header className="staff-header">
        <div className="staff-header__inner">
          <Link className="site-brand" to="/staff/check-in">
            <BrandMark />
            <span>Bàn Việt</span>
          </Link>
          <span className="staff-portal-label">Cổng vận hành nhà hàng</span>
          <nav>
            <Link to="/dashboard">{user?.name || 'Tài khoản'}</Link>
            <button type="button" onClick={logout}>Đăng xuất</button>
          </nav>
        </div>
      </header>

      <main className="customer-main staff-page">
      <section className="staff-hero">
        <div>
          <span className="customer-kicker">Cổng nhân viên</span>
          <h1>Check-in cho khách tại nhà hàng</h1>
          <p>
            Xin chào {user?.name || 'nhân viên'}. Khi dữ liệu đặt bàn được kết nối, bạn có thể
            tra cứu bằng mã đặt bàn hoặc số điện thoại, xác nhận bàn và chuyển món đặt trước xuống bếp.
          </p>
        </div>
        <div className="staff-status">
          <i />
          <span>Chưa kết nối dữ liệu</span>
          <small>Tính năng check-in đang được hoàn thiện</small>
        </div>
      </section>

      <section className="checkin-workspace">
        <div className="checkin-search-card">
          <header>
            <span className="customer-kicker">Tìm khách đến</span>
            <h2>Mã đặt bàn hoặc số điện thoại</h2>
            <p>Nút check-in chỉ khả dụng sau khi tải được thông tin đặt bàn.</p>
          </header>

          <label className="staff-search-field">
            <span>Thông tin tra cứu</span>
            <div>
              <span><UiIcon name="search" /></span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Ví dụ: BV-123456 hoặc 0901234567"
                autoComplete="off"
              />
            </div>
          </label>

          <button className="customer-primary-button" type="button" disabled>
            Tra cứu (chưa khả dụng)
          </button>

          {query && (
            <p className="staff-local-note" role="status">
              Đã nhập “{query}”. Tính năng tra cứu chưa được kết nối với dữ liệu đặt bàn.
            </p>
          )}
        </div>

        <aside className="checkin-guide">
          <span className="customer-kicker">Quy trình dự kiến</span>
          <h2>Khi khách đến</h2>
          <ol>
            <li><span>1</span><p><strong>Tìm đặt bàn</strong> bằng mã hoặc số điện thoại.</p></li>
            <li><span>2</span><p><strong>Đối chiếu</strong> thời gian, số khách và khoản cọc.</p></li>
            <li><span>3</span><p><strong>Chốt bàn</strong> và xác nhận khách đã đến trên hệ thống.</p></li>
            <li><span>4</span><p><strong>Chuyển món</strong> đã đặt trước cho bếp.</p></li>
          </ol>
          <div className="staff-warning">
            Theo chính sách dự kiến, khách đến muộn quá 30 phút sẽ được ghi nhận là không đến.
          </div>
        </aside>
      </section>
      </main>
    </div>
  )
}

export default StaffCheckInPage
