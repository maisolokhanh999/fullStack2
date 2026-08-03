import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BrandMark } from '../components/AuthIcons.jsx'
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
          <h1>Check-in khách tại nhà hàng</h1>
          <p>
            Xin chào {user?.name || 'nhân viên'}. Khi API hoàn thiện, bạn có thể tìm đặt bàn
            bằng mã hoặc số điện thoại, xác nhận bàn và chuyển món đặt trước cho bếp.
          </p>
        </div>
        <div className="staff-status">
          <i />
          <span>Giao diện sẵn sàng</span>
          <small>Đang chờ API check-in</small>
        </div>
      </section>

      <section className="checkin-workspace">
        <div className="checkin-search-card">
          <header>
            <span className="customer-kicker">Tìm khách đến</span>
            <h2>Mã đặt bàn hoặc số điện thoại</h2>
            <p>Không có thao tác check-in giả khi chưa kết nối dữ liệu đặt bàn.</p>
          </header>

          <label className="staff-search-field">
            <span>Thông tin tra cứu</span>
            <div>
              <span aria-hidden="true">⌕</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Ví dụ: BV-123456 hoặc 0901234567"
                autoComplete="off"
              />
            </div>
          </label>

          <button className="customer-primary-button" type="button" disabled>
            Tra cứu — đang chờ API
          </button>

          {query && (
            <p className="staff-local-note" role="status">
              Đã nhập “{query}”, nhưng frontend chưa gửi dữ liệu vì backend chưa có endpoint tra cứu.
            </p>
          )}
        </div>

        <aside className="checkin-guide">
          <span className="customer-kicker">Quy trình dự kiến</span>
          <h2>Khi khách tới nơi</h2>
          <ol>
            <li><span>1</span><p><strong>Tìm đặt bàn</strong> bằng mã hoặc số điện thoại.</p></li>
            <li><span>2</span><p><strong>Đối chiếu</strong> thời gian, số khách và khoản cọc.</p></li>
            <li><span>3</span><p><strong>Chốt bàn</strong> và check-in trong hệ thống.</p></li>
            <li><span>4</span><p><strong>Chuyển món</strong> đã đặt trước cho bếp.</p></li>
          </ol>
          <div className="staff-warning">
            Khách quá 30 phút sau giờ hẹn cần được backend đánh dấu no-show theo chính sách.
          </div>
        </aside>
      </section>
      </main>
    </div>
  )
}

export default StaffCheckInPage
