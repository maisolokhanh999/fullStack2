import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import UiIcon from '../components/UiIcon.jsx'
import { DEFAULT_RESTAURANT } from '../config/restaurant.js'
import { useAuth } from '../hooks/useAuth.js'
import { getInvoiceDetailsByInvoice } from '../services/invoiceDetailService.js'
import { getInvoices } from '../services/invoiceService.js'
import { getReservationTables } from '../services/reservationTableService.js'
import { cancelReservation } from '../services/reservationService.js'
import {
  INVOICE_STATUS_LABELS,
  RESERVATION_STATUS_LABELS,
  formatDateTime,
  formatMoney,
  labelFor,
} from '../components/admin/adminUtils.js'

const SETTLED = ['Paid', 'Refunded']
const CANCELLABLE = ['Pending', 'Confirmed']
const CLOSED_RESERVATION = ['Cancelled', 'NoShow']

function InvoiceCard({ invoice, table, details, isSettled, onCancel, isCancelling }) {
  const reservation = invoice.reservationId
  const canCancel = !isSettled && CANCELLABLE.includes(reservation?.status)
  // Huỷ đặt bàn không đóng hoá đơn kèm theo, nên khoản tiền vẫn hiện là "còn
  // phải trả". Nói thẳng tình trạng đó thay vì để khách tưởng mình đang nợ.
  const isStrandedInvoice = !isSettled && CLOSED_RESERVATION.includes(reservation?.status)

  return (
    <article className="invoice-card">
      <header className="invoice-card__top">
        <div>
          <span className="invoice-card__code">
            {reservation?.reservationCode || `#${String(invoice._id || '').slice(-8) || '—'}`}
          </span>
          <p>{formatDateTime(isSettled ? invoice.paymentDate || invoice.createdAt : invoice.createdAt)}</p>
        </div>
        <span className={`invoice-badge invoice-badge--${isSettled ? 'settled' : 'open'}`}>
          {labelFor(INVOICE_STATUS_LABELS, invoice.status)}
        </span>
      </header>

      <dl className="invoice-card__facts">
        <div>
          <dt>Bàn</dt>
          <dd>{table?.tableNumber || 'Chưa gán'}</dd>
        </div>
        <div>
          <dt>Số khách</dt>
          <dd>{reservation?.numberOfGuests ? `${reservation.numberOfGuests} người` : '—'}</dd>
        </div>
        <div>
          <dt>{isSettled ? 'Thanh toán' : 'Trạng thái bàn'}</dt>
          <dd>
            {isSettled
              ? invoice.paymentMethod
              : labelFor(RESERVATION_STATUS_LABELS, reservation?.status)}
          </dd>
        </div>
      </dl>

      {details.length > 0 ? (
        <ul className="invoice-card__items">
          {details.map((detail) => (
            <li key={detail._id}>
              <span>
                <b>{detail.quantity}</b> × {detail.itemName}
              </span>
              <strong>{formatMoney(detail.totalAmount)}</strong>
            </li>
          ))}
        </ul>
      ) : (
        <p className="invoice-card__no-items">Không đặt món trước.</p>
      )}

      {isStrandedInvoice && (
        <p className="invoice-card__stranded">
          Lượt đặt này {labelFor(RESERVATION_STATUS_LABELS, reservation?.status).toLowerCase()},
          nhưng hoá đơn vẫn đang mở. Vui lòng liên hệ nhà hàng trước khi trả khoản này.
        </p>
      )}

      <footer className="invoice-card__total">
        <span>Đã cọc {formatMoney(invoice.depositAmount)}</span>
        <div>
          <span>{isSettled ? 'Đã trả' : 'Còn phải trả'}</span>
          <strong>{formatMoney(invoice.finalAmount)}</strong>
        </div>
      </footer>

      {canCancel && (
        <button
          type="button"
          className="danger-text-button"
          disabled={isCancelling}
          onClick={() => onCancel(invoice)}
        >
          {isCancelling ? 'Đang huỷ...' : 'Huỷ đặt bàn'}
        </button>
      )}
    </article>
  )
}

function InvoicesPage() {
  const location = useLocation()
  const [isSuccessVisible, setIsSuccessVisible] = useState(Boolean(location.state?.reservationSubmitted))
  const reservationCode = location.state?.reservationCode
  const { user } = useAuth()
  const [invoices, setInvoices] = useState([])
  const [details, setDetails] = useState({})
  const [tables, setTables] = useState({})
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState('')
  const [cancelError, setCancelError] = useState('')

  useEffect(() => {
    if (!user) return undefined

    const controller = new AbortController()

    const load = async () => {
      try {
        const { invoices: mine } = await getInvoices({}, controller.signal)

        const [detailEntries, tableEntries] = await Promise.all([
          Promise.all(mine.map(async (invoice) => {
            try {
              const result = await getInvoiceDetailsByInvoice(invoice._id, controller.signal)
              return [invoice._id, result.invoiceDetails]
            } catch (requestError) {
              if (requestError.name === 'AbortError') throw requestError
              return [invoice._id, []]
            }
          })),
          Promise.all(mine.map(async (invoice) => {
            const reservationId = invoice.reservationId?._id || invoice.reservationId
            if (!reservationId) return [invoice._id, null]
            try {
              const result = await getReservationTables({ reservationId }, controller.signal)
              return [invoice._id, result.reservationTables[0]?.tableId || null]
            } catch (requestError) {
              if (requestError.name === 'AbortError') throw requestError
              return [invoice._id, null]
            }
          })),
        ])

        if (controller.signal.aborted) return

        setInvoices(mine)
        setDetails(Object.fromEntries(detailEntries))
        setTables(Object.fromEntries(tableEntries))
      } catch (requestError) {
        if (requestError.name !== 'AbortError') setError(requestError.message)
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    load()
    return () => controller.abort()
  }, [user])

  const cancelBooking = useCallback(async (invoice) => {
    const reservation = invoice.reservationId
    const reservationId = reservation?._id || reservation
    if (!reservationId) return
    if (!window.confirm(`Huỷ lượt đặt bàn ${reservation?.reservationCode || reservationId}?`)) return

    setCancellingId(invoice._id)
    setCancelError('')

    try {
      const updated = await cancelReservation(reservationId)
      setInvoices((current) => current.map((item) => (item._id === invoice._id
        ? { ...item, reservationId: { ...reservation, ...updated } }
        : item)))
    } catch (requestError) {
      setCancelError(requestError.message)
    } finally {
      setCancellingId('')
    }
  }, [])

  const open = invoices.filter((invoice) => !SETTLED.includes(invoice.status))
  const settled = invoices.filter((invoice) => SETTLED.includes(invoice.status))

  const renderGroup = (list, isSettled) => {
    if (!list.length) {
      return (
        <p className="invoice-section__empty">
          {isSettled ? 'Chưa có hoá đơn nào được thanh toán.' : 'Không có khoản nào đang chờ trả.'}
        </p>
      )
    }

    return (
      <div className="invoice-list">
        {list.map((invoice) => (
          <InvoiceCard
            key={invoice._id}
            invoice={invoice}
            table={tables[invoice._id]}
            details={details[invoice._id] || []}
            isSettled={isSettled}
            onCancel={cancelBooking}
            isCancelling={cancellingId === invoice._id}
          />
        ))}
      </div>
    )
  }

  return (
    <main className="customer-main">
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
          <span className="customer-kicker">Hoá đơn của tôi</span>
          <h1>Các khoản đã và đang chờ</h1>
          <p>Mỗi lượt đặt bàn sinh một hoá đơn. Khoản cọc được trừ vào tổng khi bạn thanh toán.</p>
        </div>
        <Link className="customer-primary-link" to={'/booking/' + DEFAULT_RESTAURANT.id}>
          Đặt bàn mới
        </Link>
      </div>

      {isLoading && (
        <div className="menu-state" role="status">
          <span className="spinner" aria-hidden="true" />
          <p>Đang tải hoá đơn...</p>
        </div>
      )}

      {!isLoading && error && (
        <div className="menu-state menu-state--error" role="alert">
          <strong>Chưa tải được hoá đơn</strong>
          <p>{error}</p>
        </div>
      )}

      {!isLoading && !error && invoices.length === 0 && (
        <section className="customer-empty-card">
          <span><UiIcon name="circle" /></span>
          <h2>Chưa có hoá đơn nào</h2>
          <p>Khi bạn giữ một bàn, hoá đơn cho lượt đặt đó sẽ xuất hiện tại đây.</p>
          <Link className="customer-primary-link" to={'/booking/' + DEFAULT_RESTAURANT.id}>
            Bắt đầu đặt bàn
          </Link>
        </section>
      )}

      {!isLoading && !error && invoices.length > 0 && (
        <>
          {cancelError && <p className="invoice-section__error" role="alert">{cancelError}</p>}

          <section className="invoice-section" aria-labelledby="invoices-open">
            <h2 id="invoices-open">Chưa thanh toán</h2>
            {renderGroup(open, false)}
          </section>

          <section className="invoice-section" aria-labelledby="invoices-settled">
            <h2 id="invoices-settled">Đã thanh toán</h2>
            {renderGroup(settled, true)}
          </section>
        </>
      )}
    </main>
  )
}

export default InvoicesPage
