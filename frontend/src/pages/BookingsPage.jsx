import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import UiIcon from '../components/UiIcon.jsx'
import { RESERVATION_STATUS_LABELS, formatDateTime, labelFor } from '../components/admin/adminUtils.js'
import { DEFAULT_RESTAURANT } from '../config/restaurant.js'
import { useAuth } from '../hooks/useAuth.js'
import { getInvoiceByReservation, getInvoices } from '../services/invoiceService.js'
import { getInvoiceDetailsByInvoice } from '../services/invoiceDetailService.js'
import { searchReservations } from '../services/reservationService.js'
import { getReservationTables } from '../services/reservationTableService.js'
import { useBookingDraft } from '../context/bookingDraftStore.js'
import { calculateBookingEstimate, formatCurrency } from '../utils/booking.js'

function BookingsPage() {
  const location = useLocation()
  const { user } = useAuth()
  const { draft, clearDraft } = useBookingDraft()
  const [isSuccessVisible, setIsSuccessVisible] = useState(Boolean(location.state?.reservationSubmitted))
  const reservationCode = location.state?.reservationCode
  const [reservations, setReservations] = useState([])
  const [tables, setTables] = useState({})
  const [invoiceMap, setInvoiceMap] = useState({})
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [invoiceDetails, setInvoiceDetails] = useState([])
  const [isInvoiceLoading, setIsInvoiceLoading] = useState(false)
  const [invoiceError, setInvoiceError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const hasDraft = Boolean(draft.visitDate || draft.visitTime || draft.items.length)
  const estimate = calculateBookingEstimate({ items: draft.items, guests: draft.guests })

  useEffect(() => {
    if (!user) {
      setReservations([])
      setTables({})
      setInvoiceMap({})
      setIsLoading(false)
      return undefined
    }

    const controller = new AbortController()

    const load = async () => {
      try {
        const phoneQuery = user.phone === undefined || user.phone === null ? '' : String(user.phone)
        const [reservationResults, invoiceResults] = await Promise.all([
          phoneQuery ? searchReservations(phoneQuery, controller.signal) : Promise.resolve([]),
          getInvoices({}, controller.signal),
        ])

        const validReservations = Array.isArray(reservationResults)
          ? reservationResults.filter((reservation) => {
              const matchesPhone = phoneQuery
                ? (reservation.customerPhone && String(reservation.customerPhone) === phoneQuery)
                  || (reservation.customerPhone && String(reservation.customerPhone) === `0${phoneQuery.replace(/^0+/, '')}`)
                : true
              const matchesName = user.name ? reservation.customerName === user.name : true
              return matchesPhone || matchesName
            })
          : []

        const invoiceList = invoiceResults?.invoices || []
        const mappedInvoices = {}
        for (const invoice of invoiceList) {
          const reservationId = invoice.reservationId?._id || invoice.reservationId
          if (reservationId) mappedInvoices[String(reservationId)] = invoice
        }

        const tableEntries = await Promise.all(
          validReservations.map(async (reservation) => {
            const reservationId = reservation._id
            try {
              const { reservationTables } = await getReservationTables({ reservationId }, controller.signal)
              return [reservationId, reservationTables[0]?.tableId || null]
            } catch (requestError) {
              if (requestError.name === 'AbortError') throw requestError
              return [reservationId, null]
            }
          }),
        )

        if (controller.signal.aborted) return

        setReservations(validReservations)
        setTables(Object.fromEntries(tableEntries))
        setInvoiceMap(mappedInvoices)
        setError('')
      } catch (requestError) {
        if (requestError.name !== 'AbortError') setError(requestError.message)
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    load()
    return () => controller.abort()
  }, [user])

  const viewInvoice = async (invoice, reservationId) => {
    setSelectedInvoice(invoice || { reservationId })
    setInvoiceDetails([])
    setInvoiceError('')
    setIsInvoiceLoading(true)
    try {
      const currentInvoice = invoice || await getInvoiceByReservation(reservationId)
      setSelectedInvoice(currentInvoice)
      const result = await getInvoiceDetailsByInvoice(currentInvoice._id)
      setInvoiceDetails(result.invoiceDetails || [])
    } catch (requestError) {
      setInvoiceError(requestError.message)
    } finally {
      setIsInvoiceLoading(false)
    }
  }

  const closeInvoice = () => {
    setSelectedInvoice(null)
    setInvoiceDetails([])
    setInvoiceError('')
  }

  return (
    <main className="customer-main bookings-page">
      {isSuccessVisible && (
        <div className="booking-success" role="status">
          <span className="booking-success__icon"><UiIcon name="check" /></span>
          <div className="booking-success__body">
            <strong>Đã gửi yêu cầu đặt bàn</strong>
            <p>
              Nhà hàng sẽ kiểm tra và xác nhận thông tin đặt bàn của bạn.
              {reservationCode && <> Mã đặt bàn của bạn là <code>{reservationCode}</code>.</>}
            </p>
          </div>
          <button
            type="button"
            className="booking-success__close"
            onClick={() => setIsSuccessVisible(false)}
            aria-label="Đóng thông báo"
          >
            <UiIcon name="close" />
          </button>
        </div>
      )}
      <div className="page-title-row">
        <div>
          <span className="customer-kicker">Lịch hẹn của bạn</span>
          <h1>Đặt bàn</h1>
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
      ) : null}

      {isLoading && (
        <div className="menu-state" role="status">
          <span className="spinner" aria-hidden="true" />
          <p>Đang tải đặt bàn...</p>
        </div>
      )}

      {!isLoading && error && (
        <div className="menu-state menu-state--error" role="alert">
          <strong>Không tải được đặt bàn</strong>
          <p>{error}</p>
        </div>
      )}

      {!isLoading && !error && reservations.length > 0 && reservations.map((reservation) => {
        const invoice = invoiceMap[String(reservation._id)]
        const assignment = tables[String(reservation._id)]

        return (
          <section className="draft-booking-card" key={reservation._id}>
            <div className="draft-booking-card__header">
              <div>
                <span>Đặt bàn</span>
                <h2>{reservation.reservationCode || DEFAULT_RESTAURANT.name}</h2>
              </div>
              <span className="draft-pill">{labelFor(RESERVATION_STATUS_LABELS, reservation.status)}</span>
            </div>
            <dl>
              <div><dt>Thời gian</dt><dd>{formatDateTime(reservation.expectedCheckInTime)}</dd></div>
              <div><dt>Số khách</dt><dd>{reservation.numberOfGuests} người</dd></div>
              <div><dt>Bàn</dt><dd>{assignment ? `Bàn ${assignment.tableNumber || assignment._id}` : 'Chưa gán'}</dd></div>
              <div><dt>Hóa đơn</dt><dd><button type="button" className="customer-inline-button" onClick={() => viewInvoice(invoice, reservation._id)}>Xem</button></dd></div>
              <div><dt>Ghi chú</dt><dd>{reservation.note || 'Không có'}</dd></div>
            </dl>
          </section>
        )
      })}

      {!isLoading && !error && reservations.length === 0 && !hasDraft && (
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
          </div>
        </section>
      )}
      {selectedInvoice && (
        <div className="customer-modal-backdrop" role="presentation" onMouseDown={closeInvoice}>
          <section className="customer-modal" role="dialog" aria-modal="true" aria-label="Thông tin hóa đơn" onMouseDown={(event) => event.stopPropagation()}>
            <button type="button" className="customer-modal__close" onClick={closeInvoice}>Đóng</button>
            <span className="customer-kicker">Hóa đơn</span>
            <h2>{selectedInvoice.reservationId?.reservationCode || 'Chi tiết hóa đơn'}</h2>
            <p>Trạng thái: {selectedInvoice.status === 'Paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}</p>
            {isInvoiceLoading ? <div className="menu-state" role="status"><span className="spinner" aria-hidden="true" /><p>Đang tải thông tin hóa đơn...</p></div> : invoiceError ? <p className="invoice-section__error" role="alert">{invoiceError}</p> : <><ul className="invoice-card__items">{invoiceDetails.length ? invoiceDetails.map((detail) => <li key={detail._id}><span>{detail.quantity} × {detail.itemName}</span><strong>{formatCurrency(detail.totalAmount)}</strong></li>) : <li><span>Chưa có món đặt trước</span></li>}</ul><footer className="invoice-card__total"><span>Tiền cọc {formatCurrency(selectedInvoice.depositAmount)}</span><div><span>Còn phải trả</span><strong>{formatCurrency(selectedInvoice.finalAmount)}</strong></div></footer></>}
          </section>
        </div>
      )}
    </main>
  )
}

export default BookingsPage
