import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import DataSourceNotice from '../components/customer/DataSourceNotice.jsx'
import UiIcon from '../components/UiIcon.jsx'
import { DEFAULT_RESTAURANT } from '../config/restaurant.js'
import { useAuth } from '../hooks/useAuth.js'
import { getInvoiceDetailsByInvoice } from '../services/invoiceDetailService.js'
import { getInvoices } from '../services/invoiceService.js'
import { getReservationTables } from '../services/reservationTableService.js'
import { formatDateTime, formatMoney } from '../components/admin/adminUtils.js'

const invoiceStatusLabels = {
  Pending: 'Chờ thanh toán',
  Finalized: 'Đã chốt',
  Paid: 'Đã thanh toán',
  Cancelled: 'Đã hủy',
  Refunded: 'Đã hoàn tiền',
}

const reservationStatusLabels = {
  Pending: 'Chờ xác nhận',
  Confirmed: 'Đã xác nhận',
  CheckedIn: 'Đã check-in',
  Completed: 'Đã hoàn tất',
  Cancelled: 'Đã hủy',
  NoShow: 'Không đến',
}

function RestaurantsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [invoices, setInvoices] = useState([])
  const [invoiceDetails, setInvoiceDetails] = useState({})
  const [invoiceTables, setInvoiceTables] = useState({})
  const [invoiceError, setInvoiceError] = useState('')
  const [isInvoiceLoading, setIsInvoiceLoading] = useState(true)
  const isInvoiceModalOpen = location.hash === '#my-invoices' || location.state?.openInvoices

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
              <div className="dashboard-invoice__top"><strong>Hóa đơn #{invoice._id}</strong><span>{invoiceStatusLabels[invoice.status] || invoice.status}</span></div>
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
              <div className="dashboard-invoice__top"><strong>Hóa đơn #{invoice._id}</strong><span>{invoiceStatusLabels[invoice.status] || invoice.status}</span></div>
              <p>{formatDateTime(invoice.createdAt)} · {invoice.paymentMethod}</p>
              <p>Bàn đã đặt: {invoiceTables[invoice._id]?.tableNumber || 'Chưa có thông tin bàn'}</p>
              <p>Trạng thái bàn: {reservationStatusLabels[invoice.reservationId?.status] || 'Đang chờ cập nhật'}</p>
              <ul>{(invoiceDetails[invoice._id] || []).map((detail) => <li key={detail._id}><span>{detail.quantity} × {detail.itemName}</span><strong>{formatMoney(detail.totalAmount)}</strong></li>)}</ul>
              <div className="dashboard-invoice__total"><span>Tiền cọc: {formatMoney(invoice.depositAmount)}</span><strong>Còn phải trả: {formatMoney(invoice.finalAmount)}</strong></div>
            </article>)}
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
    </main>
  )
}

export default RestaurantsPage
