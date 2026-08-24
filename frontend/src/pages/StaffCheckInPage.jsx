import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BrandMark } from '../components/AuthIcons.jsx'
import UiIcon from '../components/UiIcon.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { checkInReservation, searchReservations } from '../services/reservationService.js'
import { getReservationTables } from '../services/reservationTableService.js'
import { formatDateTime, formatMoney } from '../components/admin/adminUtils.js'

function StaffCheckInPage() {
  const navigate = useNavigate()
  const { user, endSession } = useAuth()
  const [query, setQuery] = useState('')
  const [reservations, setReservations] = useState([])
  const [reservationTables, setReservationTables] = useState({})
  const [error, setError] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [isCheckingIn, setIsCheckingIn] = useState(false)

  const logout = () => {
    endSession()
    navigate('/login', { replace: true })
  }

  const search = async (event) => {
    event.preventDefault()
    const searchValue = query.trim()
    if (!searchValue) return

    setIsSearching(true)
    setError('')
    setReservations([])
    setReservationTables({})
    try {
      const results = await searchReservations(searchValue)
      if (!results.length) {
        setError('Không tìm thấy đặt bàn với thông tin này.')
      } else {
        const tableEntries = await Promise.all(results.map(async (reservation) => {
          const { reservationTables: assignedTables } = await getReservationTables(
            { reservationId: reservation._id },
          )
          return [reservation._id, assignedTables.map((assignment) => assignment.tableId)]
        }))
        setReservations(results)
        setReservationTables(Object.fromEntries(tableEntries))
      }
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSearching(false)
    }
  }

  const checkIn = async (reservationId) => {
    if (!reservationId) return

    setIsCheckingIn(true)
    setError('')
    try {
      const updatedReservation = await checkInReservation(reservationId)
      setReservations((current) => current.map((item) => item._id === reservationId ? updatedReservation : item))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsCheckingIn(false)
    }
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
            Xin chào {user?.name || 'nhân viên'}. Bạn có thể tra cứu bằng mã đặt bàn hoặc số điện thoại,
            xác nhận khách đã đến và đối chiếu khoản cọc.
          </p>
        </div>
        <div className="staff-status">
          <i />
          <span>Đã kết nối dữ liệu</span>
          <small>Sẵn sàng tra cứu và check-in</small>
        </div>
      </section>

      <section className="checkin-workspace">
        <div className="checkin-search-card">
          <header>
            <span className="customer-kicker">Tìm khách đến</span>
            <h2>Mã đặt bàn hoặc số điện thoại</h2>
            <p>Nhập số điện thoại hoặc mã đặt bàn để tải thông tin khách.</p>
          </header>

          <form onSubmit={search}>
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

            <button className="customer-primary-button" type="submit" disabled={isSearching || !query.trim()}>
              {isSearching ? 'Đang tra cứu...' : 'Tra cứu'}
            </button>
          </form>

          {error && <p className="staff-local-note" role="alert">{error}</p>}
          {reservations.map((reservation) => <div className="staff-local-note" role="status" key={reservation._id}>
            <strong>{reservation.customerName}</strong>
            <p>Mã: {reservation.reservationCode || reservation._id}</p>
            <p>{formatDateTime(reservation.expectedCheckInTime)} · {reservation.numberOfGuests} khách · Cọc {formatMoney(reservation.depositAmount)}</p>
            <p>Bàn chờ check: {(reservationTables[reservation._id] || []).map((table) => `Bàn ${table?.tableNumber || table?._id}`).join(', ') || 'Chưa gán bàn'}</p>
            <p>Trạng thái: {reservation.status}</p>
            {['Pending', 'Confirmed'].includes(reservation.status) && <button className="customer-primary-button" type="button" onClick={() => checkIn(reservation._id)} disabled={isCheckingIn}>{isCheckingIn ? 'Đang check-in...' : 'Xác nhận check-in'}</button>}
          </div>)}
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
