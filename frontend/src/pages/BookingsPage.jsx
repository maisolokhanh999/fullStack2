import { Link } from 'react-router-dom'
import { DEFAULT_RESTAURANT } from '../config/restaurant.js'
import { useBookingDraft } from '../context/bookingDraftStore.js'
import { reservationApiNotice } from '../services/reservationService.js'
import { calculateBookingEstimate, formatCurrency } from '../utils/booking.js'

function BookingsPage() {
  const { draft, clearDraft } = useBookingDraft()
  const hasDraft = Boolean(draft.visitDate || draft.visitTime || draft.items.length)
  const estimate = calculateBookingEstimate({ items: draft.items, guests: draft.guests })

  return (
    <main className="customer-main bookings-page">
      <div className="page-title-row">
        <div>
          <span className="customer-kicker">Không bỏ lỡ kế hoạch</span>
          <h1>Đặt bàn của tôi</h1>
          <p>Lịch sử xác nhận sẽ xuất hiện tại đây khi backend hoàn thiện API đặt bàn.</p>
        </div>
        <Link className="customer-primary-link" to={'/booking/' + DEFAULT_RESTAURANT.id}>
          Tạo đặt bàn mới
        </Link>
      </div>

      <div className="api-pending-notice" role="status">
        <span aria-hidden="true">i</span>
        <div>
          <strong>Chưa có dữ liệu đặt bàn từ máy chủ</strong>
          <p>{reservationApiNotice} Trang này không tạo mã đặt bàn hoặc trạng thái giả.</p>
        </div>
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
          <span>○</span>
          <h2>Bạn chưa có bản nháp nào</h2>
          <p>Hãy chọn thời gian và số người. Chọn món trước là hoàn toàn tùy chọn.</p>
          <Link className="customer-primary-link" to={'/booking/' + DEFAULT_RESTAURANT.id}>
            Bắt đầu đặt bàn
          </Link>
        </section>
      )}
    </main>
  )
}

export default BookingsPage
