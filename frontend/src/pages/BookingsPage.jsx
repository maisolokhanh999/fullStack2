import { Link, useLocation } from 'react-router-dom'
import UiIcon from '../components/UiIcon.jsx'
import { DEFAULT_RESTAURANT } from '../config/restaurant.js'
import { useBookingDraft } from '../context/bookingDraftStore.js'
import { calculateBookingEstimate, formatCurrency } from '../utils/booking.js'

function BookingsPage() {
  const location = useLocation()
  const { draft, clearDraft } = useBookingDraft()
  const hasDraft = Boolean(draft.visitDate || draft.visitTime || draft.items.length)
  const estimate = calculateBookingEstimate({ items: draft.items, guests: draft.guests })

  return (
    <main className="customer-main bookings-page">
      {location.state?.reservationSubmitted && <div className="api-pending-notice" role="status"><span><UiIcon name="check" /></span><div><strong>Đã gửi yêu cầu đặt bàn</strong><p>Nhà hàng sẽ kiểm tra và xác nhận thông tin đặt bàn của bạn.</p></div></div>}
      <div className="page-title-row">
        <div>
          <span className="customer-kicker">Lịch hẹn của bạn</span>
          <h1>Đặt bàn của tôi</h1>
          <p>
            Bản nháp đang soạn được giữ trên trình duyệt này. Lượt đã gửi đi nằm ở{' '}
            <Link to="/invoices">Hoá đơn của tôi</Link>.
          </p>
        </div>
        <Link className="customer-primary-link" to={'/booking/' + DEFAULT_RESTAURANT.id}>
          Tạo đặt bàn mới
        </Link>
      </div>

      {hasDraft ? (
        <section className="draft-booking-card">
          <div className="draft-booking-card__header">
            <div>
              <span>Bản nháp trên thiết bị này</span>
              <h2>{DEFAULT_RESTAURANT.name}</h2>
            </div>
            <span className="draft-pill">Chưa gửi</span>
          </div>
          <dl>
            <div><dt>Ngày</dt><dd>{draft.visitDate || 'Chưa chọn'}</dd></div>
            <div><dt>Giờ</dt><dd>{draft.visitTime || 'Chưa chọn'}</dd></div>
            <div><dt>Số khách</dt><dd>{draft.guests} người</dd></div>
            <div><dt>Món đã chọn</dt><dd>{draft.items.reduce((total, item) => total + item.quantity, 0)} món</dd></div>
            <div><dt>Cọc dự kiến</dt><dd>{formatCurrency(estimate.estimatedDeposit)}</dd></div>
          </dl>
          <div className="draft-booking-card__actions">
            <Link className="customer-primary-link" to={'/booking/' + DEFAULT_RESTAURANT.id}>
              Tiếp tục chỉnh sửa
            </Link>
            <button className="danger-text-button" type="button" onClick={clearDraft}>
              Xóa bản nháp
            </button>
          </div>
        </section>
      ) : (
        <section className="customer-empty-card">
          <span><UiIcon name="circle" /></span>
          <h2>Chưa có bản nháp nào đang soạn</h2>
          <p>
            Chọn thời gian và số khách để bắt đầu — không bắt buộc chọn món trước.
            Những lượt bạn đã gửi đi được xem tại Hoá đơn của tôi.
          </p>
          <div className="customer-empty-card__actions">
            <Link className="customer-primary-link" to={'/booking/' + DEFAULT_RESTAURANT.id}>
              Bắt đầu đặt bàn
            </Link>
            <Link className="customer-secondary-link" to="/invoices">
              Xem lượt đã đặt
            </Link>
          </div>
        </section>
      )}
    </main>
  )
}

export default BookingsPage
