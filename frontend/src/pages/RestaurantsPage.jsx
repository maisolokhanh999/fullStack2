import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import DataSourceNotice from '../components/customer/DataSourceNotice.jsx'
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

const whyUsItems = [
  {
    icon: 'clock',
    title: 'Đặt bàn trong vài bước',
    description: 'Chọn thời gian và số khách nhanh chóng ngay trên web, không cần gọi điện chờ đợi.',
  },
  {
    icon: 'check',
    title: 'Giữ bàn bằng đặt cọc',
    description: 'Đặt cọc để giữ chỗ chắc chắn, hạn chế mất bàn vào khung giờ đông khách.',
  },
  {
    icon: 'star',
    title: 'Thực đơn chọn trước',
    description: 'Xem giá và chọn món yêu thích ngay lúc đặt bàn nếu muốn, hoặc chọn trực tiếp khi đến.',
  },
  {
    icon: 'info',
    title: 'Theo dõi minh bạch',
    description: 'Xem lại lịch sử đặt bàn, hoá đơn và huỷ lịch dễ dàng trong mục "Hóa đơn của tôi".',
  },
]

const faqItems = [
  {
    question: 'Đặt bàn có mất phí không?',
    answer:
      'Một số khung giờ yêu cầu đặt cọc giữ chỗ. Số tiền hiển thị ở bước xem lại chỉ là ước tính; nhà hàng sẽ xác nhận số tiền chính thức.',
  },
  {
    question: 'Tôi có bắt buộc chọn món trước không?',
    answer: 'Không. Bạn có thể chỉ đặt bàn và chọn món trực tiếp khi đến nhà hàng.',
  },
  {
    question: 'Tôi có thể huỷ đặt bàn đã gửi không?',
    answer:
      'Có. Vào mục "Hóa đơn của tôi" để xem và huỷ các lượt đặt còn ở trạng thái chờ xác nhận hoặc đã xác nhận.',
  },
  {
    question: 'Thanh toán như thế nào?',
    answer:
      'Thanh toán được ghi nhận trực tiếp tại nhà hàng; trạng thái hoá đơn sẽ cập nhật ngay sau khi hoàn tất.',
  },
]

function RestaurantsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [invoices, setInvoices] = useState([])
  const [invoiceDetails, setInvoiceDetails] = useState({})
  const [invoiceTables, setInvoiceTables] = useState({})
  const [invoiceError, setInvoiceError] = useState('')
  const [isInvoiceLoading, setIsInvoiceLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState('')
  const [cancelError, setCancelError] = useState('')
  const isInvoiceModalOpen = location.hash === '#my-invoices' || location.state?.openInvoices

  const cancelBooking = async (invoice) => {
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
  }

  useEffect(() => {
    if (!user) return undefined

    const controller = new AbortController()
    const loadInvoices = async () => {
      try {
        const { invoices: customerInvoices } = await getInvoices({}, controller.signal)
        const detailEntries = await Promise.all(customerInvoices.map(async (invoice) => {
          try {
            const result = await getInvoiceDetailsByInvoice(invoice._id, controller.signal)
            return [invoice._id, result.invoiceDetails]
          } catch (requestError) {
            if (requestError.name === 'AbortError') throw requestError
            return [invoice._id, []]
          }
        }))
        const tableEntries = await Promise.all(customerInvoices.map(async (invoice) => {
          const reservationId = invoice.reservationId?._id || invoice.reservationId
          if (!reservationId) return [invoice._id, null]
          try {
            const result = await getReservationTables({ reservationId }, controller.signal)
            return [invoice._id, result.reservationTables[0]?.tableId || null]
          } catch (requestError) {
            if (requestError.name === 'AbortError') throw requestError
            return [invoice._id, null]
          }
        }))
        if (!controller.signal.aborted) {
          setInvoices(customerInvoices)
          setInvoiceDetails(Object.fromEntries(detailEntries))
          setInvoiceTables(Object.fromEntries(tableEntries))
        }
      } catch (requestError) {
        if (requestError.name !== 'AbortError') setInvoiceError(requestError.message)
      } finally {
        if (!controller.signal.aborted) setIsInvoiceLoading(false)
      }
    }

    loadInvoices()
    return () => controller.abort()
  }, [user])

  return (
    <main className="customer-main">
      <section className="customer-hero">
        <div className="customer-hero__copy">
          <span className="customer-kicker">Đặt trước · Đến là thưởng thức</span>
          <h1>Bữa ăn trọn vẹn bắt đầu từ một chỗ ngồi được chuẩn bị kỹ.</h1>
          <p>
            Chọn thời gian, đặt cọc để giữ bàn và chọn món trước nếu muốn.
            Khi đến nơi, bạn chỉ cần xác nhận với nhân viên để bắt đầu dùng bữa.
          </p>
        </div>
        <div className="hero-plate" aria-hidden="true">
          <span className="hero-plate__leaf hero-plate__leaf--one" />
          <span className="hero-plate__leaf hero-plate__leaf--two" />
          <span className="hero-plate__dish">B</span>
        </div>
      </section>

      <DataSourceNotice />

      {isInvoiceModalOpen && <div className="invoice-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && navigate('/restaurants', { replace: true })}>
        <section className="invoice-modal" role="dialog" aria-modal="true" aria-labelledby="restaurant-invoices-title">
          <div className="invoice-modal__header">
            <div><span className="customer-kicker">Lịch sử hóa đơn</span><h2 id="restaurant-invoices-title">Hóa đơn của tôi</h2></div>
            <button type="button" className="invoice-modal__close" onClick={() => navigate('/restaurants', { replace: true })} aria-label="Đóng hóa đơn">×</button>
          </div>
          {invoiceError && <p className="dashboard-invoices__error">{invoiceError}</p>}
          {isInvoiceLoading && <p className="dashboard-invoices__empty">Đang tải hóa đơn...</p>}
          {!isInvoiceLoading && !invoiceError && !invoices.length && <p className="dashboard-invoices__empty">Chưa có hóa đơn nào.</p>}
          <section className="invoice-group">
            <h3>Hóa đơn đã thanh toán</h3>
            {invoices.filter((invoice) => ['Paid', 'Refunded'].includes(invoice.status)).map((invoice) => <article className="dashboard-invoice" key={invoice._id}>
              <div className="dashboard-invoice__top"><strong>Hóa đơn #{invoice._id}</strong><span>{labelFor(INVOICE_STATUS_LABELS, invoice.status)}</span></div>
              <p>{formatDateTime(invoice.paymentDate || invoice.createdAt)} · {invoice.paymentMethod}</p>
              <p>Bàn: {invoiceTables[invoice._id]?.tableNumber || 'Chưa có thông tin bàn'}</p>
              <ul>{(invoiceDetails[invoice._id] || []).map((detail) => <li key={detail._id}><span>{detail.quantity} × {detail.itemName}</span><strong>{formatMoney(detail.totalAmount)}</strong></li>)}</ul>
              <div className="dashboard-invoice__total"><span>Tiền cọc: {formatMoney(invoice.depositAmount)}</span><strong>{formatMoney(invoice.finalAmount)}</strong></div>
            </article>)}
            {!invoices.some((invoice) => ['Paid', 'Refunded'].includes(invoice.status)) && <p className="invoice-group__empty">Chưa có hóa đơn đã thanh toán.</p>}
          </section>
          <section className="invoice-group">
            <h3>Hóa đơn chưa thanh toán</h3>
            {invoices.filter((invoice) => !['Paid', 'Refunded'].includes(invoice.status)).map((invoice) => <article className="dashboard-invoice" key={invoice._id}>
              <div className="dashboard-invoice__top"><strong>Hóa đơn #{invoice._id}</strong><span>{labelFor(INVOICE_STATUS_LABELS, invoice.status)}</span></div>
              <p>{formatDateTime(invoice.createdAt)} · {invoice.paymentMethod}</p>
              <p>Bàn đã đặt: {invoiceTables[invoice._id]?.tableNumber || 'Chưa có thông tin bàn'}</p>
              <p>Trạng thái bàn: {labelFor(RESERVATION_STATUS_LABELS, invoice.reservationId?.status)}</p>
              <ul>{(invoiceDetails[invoice._id] || []).map((detail) => <li key={detail._id}><span>{detail.quantity} × {detail.itemName}</span><strong>{formatMoney(detail.totalAmount)}</strong></li>)}</ul>
              <div className="dashboard-invoice__total"><span>Tiền cọc: {formatMoney(invoice.depositAmount)}</span><strong>Còn phải trả: {formatMoney(invoice.finalAmount)}</strong></div>
              {['Pending', 'Confirmed'].includes(invoice.reservationId?.status) && <button type="button" className="danger-text-button" disabled={cancellingId === invoice._id} onClick={() => cancelBooking(invoice)}>{cancellingId === invoice._id ? 'Đang huỷ...' : 'Huỷ đặt bàn'}</button>}
            </article>)}
            {cancelError && <p className="dashboard-invoices__error">{cancelError}</p>}
            {!invoices.some((invoice) => !['Paid', 'Refunded'].includes(invoice.status)) && <p className="invoice-group__empty">Chưa có hóa đơn chưa thanh toán.</p>}
          </section>
        </section>
      </div>}

      <section className="restaurant-section" aria-labelledby="restaurant-heading">
        <div className="section-heading">
          <div>
            <span className="customer-kicker">Điểm đến hiện có</span>
            <h2 id="restaurant-heading">Chọn nhà hàng</h2>
          </div>
          <p>Danh sách chi nhánh đang được cập nhật. Hiện tại, bạn có thể đặt bàn tại Bàn Việt.</p>
        </div>

        <article className="restaurant-card">
          <div className="restaurant-card__art" aria-hidden="true">
            <span>BV</span>
          </div>
          <div className="restaurant-card__body">
            <div>
              <span className="availability-pill"><i /> Đang hiển thị thực đơn</span>
              <h3>{DEFAULT_RESTAURANT.name}</h3>
              <p>{DEFAULT_RESTAURANT.description}</p>
            </div>
            <dl className="restaurant-meta">
              <div>
                <dt>Giờ phục vụ</dt>
                <dd>{DEFAULT_RESTAURANT.hours}</dd>
              </div>
              <div>
                <dt>Mức cọc dự kiến</dt>
                <dd>{DEFAULT_RESTAURANT.depositRate * 100}%</dd>
              </div>
            </dl>
            <div className="restaurant-card__actions">
              <Link className="customer-primary-link" to={'/restaurants/' + DEFAULT_RESTAURANT.id}>
                Xem thực đơn
                <UiIcon name="arrow-right" />
              </Link>
              <Link className="customer-secondary-link" to={'/booking/' + DEFAULT_RESTAURANT.id}>
                Đặt bàn ngay
              </Link>
            </div>
          </div>
        </article>
      </section>

      <section className="why-us-section" aria-labelledby="why-us-heading">
        <div className="section-heading">
          <div>
            <span className="customer-kicker">Vì sao chọn Bàn Việt</span>
            <h2 id="why-us-heading">Đặt bàn nhẹ nhàng, đến nơi là dùng bữa</h2>
          </div>
        </div>
        <div className="why-us-grid">
          {whyUsItems.map((item) => (
            <article className="why-us-card" key={item.title}>
              <span className="why-us-card__icon"><UiIcon name={item.icon} /></span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="faq-section" aria-labelledby="faq-heading">
        <div className="section-heading">
          <div>
            <span className="customer-kicker">Giải đáp</span>
            <h2 id="faq-heading">Câu hỏi thường gặp</h2>
          </div>
        </div>
        <div className="faq-list">
          {faqItems.map((item) => (
            <details className="faq-item" key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  )
}

export default RestaurantsPage
