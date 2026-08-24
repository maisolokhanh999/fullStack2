import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import UiIcon from '../components/UiIcon.jsx'
import { DEFAULT_RESTAURANT } from '../config/restaurant.js'
import { useBookingDraft } from '../context/bookingDraftStore.js'
import { useAuth } from '../hooks/useAuth.js'
import { getReservations } from '../services/reservationService.js'
import { getReservationTables } from '../services/reservationTableService.js'
import { getInvoiceDetailsByInvoice } from '../services/invoiceDetailService.js'
import { getInvoices } from '../services/invoiceService.js'
import { formatDateTime, formatMoney } from '../components/admin/adminUtils.js'
import { calculateBookingEstimate, formatCurrency } from '../utils/booking.js'

function BookingsPage() {
  const location = useLocation()
  const { user } = useAuth()
  const { draft, clearDraft } = useBookingDraft()
  const [reservations, setReservations] = useState([])
  const [reservationTables, setReservationTables] = useState({})
  const [paidInvoices, setPaidInvoices] = useState([])
  const [invoiceDetails, setInvoiceDetails] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const hasDraft = Boolean(draft.visitDate || draft.visitTime || draft.items.length)
  const estimate = calculateBookingEstimate({ items: draft.items, guests: draft.guests })

  useEffect(() => {
    if (!user?.phone) {
      setIsLoading(false)
      return undefined
    }

    const controller = new AbortController()
    const loadReservations = async () => {
      try {
        const [{ reservations: customerReservations }, { invoices }] = await Promise.all([
          getReservations({ query: user.phone }, controller.signal),
          getInvoices({ status: 'Paid' }, controller.signal),
        ])
        const tableEntries = await Promise.all(customerReservations.map(async (reservation) => {
          const result = await getReservationTables(
            { reservationId: reservation._id },
            controller.signal,
          )
          return [reservation._id, result.reservationTables.map((entry) => entry.tableId)]
        }))
        const detailEntries = await Promise.all(invoices.map(async (invoice) => {
          const result = await getInvoiceDetailsByInvoice(invoice._id, controller.signal)
          return [invoice._id, result.invoiceDetails]
        }))
        if (!controller.signal.aborted) {
          setReservations(customerReservations)
          setReservationTables(Object.fromEntries(tableEntries))
          setPaidInvoices(invoices)
          setInvoiceDetails(Object.fromEntries(detailEntries))
        }
      } catch (requestError) {
        if (requestError.name !== 'AbortError') setLoadError(requestError.message)
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    loadReservations()
    return () => controller.abort()
  }, [user?.phone])

  return (
    <main className="customer-main bookings-page">
      {location.state?.reservationSubmitted && <div className="api-pending-notice" role="status"><span><UiIcon name="check" /></span><div><strong>Đã gửi yêu cầu đặt bàn</strong><p>Nhà hàng sẽ kiểm tra và xác nhận thông tin đặt bàn của bạn.</p></div></div>}
      <div className="page-title-row">
        <div>
          <span className="customer-kicker">Lịch hẹn của bạn</span>
          <h1>Đặt bàn của tôi</h1>
          <p>Các lượt đặt bàn và bàn đã chọn của bạn được lưu tại đây.</p>
        </div>
        <Link className="customer-primary-link" to={'/booking/' + DEFAULT_RESTAURANT.id}>
          Tạo đặt bàn mới
        </Link>
      </div>

      {loadError && <div className="api-pending-notice" role="alert"><span><UiIcon name="info" /></span><div><strong>Không thể tải đặt bàn</strong><p>{loadError}</p></div></div>}

      {!isLoading && paidInvoices.length > 0 && <section className="draft-booking-card">
        <div className="draft-booking-card__header"><div><span>Lịch sử thanh toán</span><h2>Hóa đơn đã thanh toán</h2></div></div>
        {paidInvoices.map((invoice) => <article key={invoice._id} className="review-card">
          <div className="draft-booking-card__header"><div><span>Số HĐ: {invoice._id}</span><h2>{invoice.reservationId?.reservationCode || 'Hóa đơn đặt bàn'}</h2></div><span className="draft-pill">Đã thanh toán</span></div>
          <dl>
            <div><dt>Ngày thanh toán</dt><dd>{formatDateTime(invoice.paymentDate)}</dd></div>
            <div><dt>Phương thức</dt><dd>{invoice.paymentMethod}</dd></div>
            <div><dt>Tiền cọc</dt><dd>{formatMoney(invoice.depositAmount)}</dd></div>
            <div><dt>Tổng thanh toán</dt><dd>{formatMoney(invoice.finalAmount)}</dd></div>
          </dl>
          <div className="booking-invoice-items"><strong>Món đã dùng</strong>{(invoiceDetails[invoice._id] || []).length ? <ul className="review-items">{invoiceDetails[invoice._id].map((detail) => <li key={detail._id}><span>{detail.quantity} × {detail.itemName}</span><strong>{formatMoney(detail.totalAmount)}</strong></li>)}</ul> : <p>Chưa có món trong hóa đơn.</p>}</div>
        </article>)}
      </section>}

      {!isLoading && reservations.length > 0 && <section className="draft-booking-card">
        <div className="draft-booking-card__header"><div><span>Đặt bàn đã gửi</span><h2>Lịch sử đặt bàn</h2></div></div>
        {reservations.map((reservation) => <article key={reservation._id} className="review-card">
          <div className="draft-booking-card__header"><div><span>{reservation.reservationCode || reservation._id}</span><h2>{DEFAULT_RESTAURANT.name}</h2></div><span className="draft-pill">{reservation.status}</span></div>
          <dl>
            <div><dt>Thời gian</dt><dd>{formatDateTime(reservation.expectedCheckInTime)}</dd></div>
            <div><dt>Số khách</dt><dd>{reservation.numberOfGuests} người</dd></div>
            <div><dt>Bàn</dt><dd>{(reservationTables[reservation._id] || []).map((table) => `Bàn ${table?.tableNumber}`).join(', ') || 'Đang chờ gán bàn'}</dd></div>
            <div><dt>Tiền cọc</dt><dd>{formatMoney(reservation.depositAmount)}</dd></div>
          </dl>
        </article>)}
      </section>}

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
          <h2>Bạn chưa có bản nháp nào</h2>
          <p>Hãy chọn thời gian và số khách. Bạn không bắt buộc phải chọn món trước.</p>
          <Link className="customer-primary-link" to={'/booking/' + DEFAULT_RESTAURANT.id}>
            Bắt đầu đặt bàn
          </Link>
        </section>
      )}
    </main>
  )
}

export default BookingsPage
