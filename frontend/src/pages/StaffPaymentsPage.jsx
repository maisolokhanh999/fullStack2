import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BrandMark } from '../components/AuthIcons.jsx'
import UiIcon from '../components/UiIcon.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { finalizeInvoice, getInvoiceById, getInvoices, getInvoiceTransferQr, payInvoice } from '../services/invoiceService.js'
import { createInvoiceDetail, deleteInvoiceDetail, getInvoiceDetailsByInvoice, updateInvoiceDetail } from '../services/invoiceDetailService.js'
import { getDishes } from '../services/dishService.js'
import { formatMoney, labelFor, INVOICE_STATUS_LABELS } from '../components/admin/adminUtils.js'

function StaffPaymentsPage() {
  const navigate = useNavigate()
  const { user, endSession } = useAuth()
  const [invoices, setInvoices] = useState([])
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')
  const [cashReceived, setCashReceived] = useState({})
  const [paymentMethod, setPaymentMethod] = useState({})
  const [transferQr, setTransferQr] = useState({})
  const [dishes, setDishes] = useState([])
  const [selectedDishes, setSelectedDishes] = useState({})
  const [quantities, setQuantities] = useState({})
  const [invoiceDetails, setInvoiceDetails] = useState({})

  useEffect(() => {
    const load = async () => {
      try {
        const result = await getInvoices()
        const invoiceList = result.invoices || []
        setInvoices(invoiceList)
        const detailEntries = await Promise.all(invoiceList.map(async (invoice) => {
          const detailResult = await getInvoiceDetailsByInvoice(invoice._id)
          return [invoice._id, detailResult.invoiceDetails || []]
        }))
        setInvoiceDetails(Object.fromEntries(detailEntries))
      } catch (requestError) {
        setError(requestError.message)
      }
    }
    load()
    getDishes({ status: 'Available' }).then((result) => setDishes(result.dishes || [])).catch(() => {})
  }, [])

  const logout = () => {
    endSession()
    navigate('/login', { replace: true })
  }

  const pay = async (invoice) => {
    const method = paymentMethod[invoice._id] || 'Cash'
    const received = Number(cashReceived[invoice._id])
    if (method === 'Cash' && (!Number.isFinite(received) || received < invoice.finalAmount)) {
      setError('Tiền khách đưa phải lớn hơn hoặc bằng số tiền cần thanh toán.')
      return
    }
    try {
      setBusyId(invoice._id)
      setError('')
      const updated = await payInvoice(invoice._id, { paymentMethod: method, cashReceived: method === 'Cash' ? received : 0 })
      setInvoices((current) => current.map((item) => item._id === invoice._id ? updated : item))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusyId('')
    }
  }

  const showTransferQr = async (invoice, type = 'final') => {
    try {
      setBusyId(invoice._id)
      setError('')
      const qr = await getInvoiceTransferQr(invoice._id, type)
      setTransferQr((current) => ({ ...current, [invoice._id]: qr }))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusyId('')
    }
  }

  const finalize = async (invoice) => {
    try {
      setBusyId(invoice._id)
      setError('')
      const updated = await finalizeInvoice(invoice._id)
      setInvoices((current) => current.map((item) => item._id === invoice._id ? updated : item))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusyId('')
    }
  }

  const addDish = async (invoice) => {
    const dishId = selectedDishes[invoice._id]
    const quantity = Number(quantities[invoice._id] || 1)
    if (!dishId || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      setError('Vui lòng chọn món và nhập số lượng từ 1 đến 99.')
      return
    }
    try {
      setBusyId(invoice._id)
      setError('')
      await createInvoiceDetail({ invoiceId: invoice._id, dishId, quantity })
      const updated = await getInvoiceById(invoice._id)
      setInvoices((current) => current.map((item) => item._id === invoice._id ? updated : item))
      const detailResult = await getInvoiceDetailsByInvoice(invoice._id)
      setInvoiceDetails((current) => ({ ...current, [invoice._id]: detailResult.invoiceDetails || [] }))
      setSelectedDishes((current) => ({ ...current, [invoice._id]: '' }))
      setQuantities((current) => ({ ...current, [invoice._id]: 1 }))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusyId('')
    }
  }

  const removeDish = async (invoice, detailId) => {
    try {
      setBusyId(invoice._id)
      setError('')
      await deleteInvoiceDetail(detailId)
      const [updated, detailResult] = await Promise.all([
        getInvoiceById(invoice._id),
        getInvoiceDetailsByInvoice(invoice._id),
      ])
      setInvoices((current) => current.map((item) => item._id === invoice._id ? updated : item))
      setInvoiceDetails((current) => ({ ...current, [invoice._id]: detailResult.invoiceDetails || [] }))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusyId('')
    }
  }

  const decreaseDish = async (invoice, detail) => {
    if (detail.quantity <= 1) return
    try {
      setBusyId(invoice._id)
      setError('')
      await updateInvoiceDetail(detail._id, { quantity: detail.quantity - 1 })
      const [updated, detailResult] = await Promise.all([
        getInvoiceById(invoice._id),
        getInvoiceDetailsByInvoice(invoice._id),
      ])
      setInvoices((current) => current.map((item) => item._id === invoice._id ? updated : item))
      setInvoiceDetails((current) => ({ ...current, [invoice._id]: detailResult.invoiceDetails || [] }))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusyId('')
    }
  }

  const visibleInvoices = invoices.filter((invoice) => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return true
    return [
      invoice._id,
      invoice.reservationId?.reservationCode,
      invoice.payerName,
      invoice.phoneNumber,
    ].some((value) => String(value || '').toLowerCase().includes(normalizedQuery))
  })

  return (
    <div className="staff-app">
      <header className="staff-header">
        <div className="staff-header__inner">
          <Link className="site-brand" to="/staff/check-in"><BrandMark /><span>Bàn Việt</span></Link>
          <span className="staff-portal-label">Cổng vận hành nhà hàng</span>
          <nav><Link to="/staff/check-in">Tra cứu / Check-in</Link><Link to="/staff/payments" aria-current="page">Thanh toán</Link><Link to="/dashboard">{user?.name || 'Tài khoản'}</Link><button type="button" onClick={logout}>Đăng xuất</button></nav>
        </div>
      </header>
      <main className="customer-main staff-page staff-payments-page">
        <section className="staff-hero"><div><span className="customer-kicker">Cổng nhân viên</span><h1>Thanh toán hóa đơn</h1><p>Xin chào {user?.name || 'nhân viên'}. Chọn hóa đơn đã chốt để hoàn tất thanh toán.</p></div></section>
        {error && <p className="staff-local-note" role="alert">{error}</p>}
        {!error && invoices.length > 0 && <div className="staff-invoice-search"><UiIcon name="search" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm theo mã đặt bàn, tên hoặc số điện thoại khách" aria-label="Tìm hóa đơn của khách" /></div>}
        {!error && invoices.length === 0 && <div className="menu-state"><strong>Chưa có hóa đơn</strong><p>Không có hóa đơn nào cần xử lý.</p></div>}
        {!error && invoices.length > 0 && visibleInvoices.length === 0 && <div className="menu-state"><strong>Không tìm thấy hóa đơn</strong><p>Thử lại với mã đặt bàn, tên hoặc số điện thoại khác.</p></div>}
        <div className="staff-invoice-list">
          {visibleInvoices.map((invoice) => (
            <article className="staff-invoice-card" key={invoice._id}>
              <div><span className="customer-kicker">Hóa đơn</span><h2>{invoice.reservationId?.reservationCode || invoice._id}</h2><p>{invoice.payerName} · {invoice.phoneNumber}</p></div>
              <span className="admin-status-badge" data-status={invoice.status}>{labelFor(INVOICE_STATUS_LABELS, invoice.status)}</span>
              <strong className="staff-invoice-card__amount">{formatMoney(invoice.finalAmount)}</strong>
              {invoice.paidBy && <p className="staff-invoice-card__paid-by">Nhân viên thanh toán: {invoice.paidBy.name || invoice.paidBy._id} ({invoice.paidBy._id})</p>}
              {(invoiceDetails[invoice._id] || []).length > 0 && <div className="staff-invoice-card__details"><strong>Món đã đặt trước</strong><ul>{invoiceDetails[invoice._id].map((detail) => <li key={detail._id}><span>{detail.itemName} x {detail.quantity}</span><span>{formatMoney(detail.totalAmount)}{invoice.status === 'Pending' && <><button type="button" onClick={() => decreaseDish(invoice, detail)} disabled={busyId === invoice._id || detail.quantity <= 1} aria-label={`Giảm một ${detail.itemName}`}>-1</button><button type="button" onClick={() => removeDish(invoice, detail._id)} disabled={busyId === invoice._id} aria-label={`Bỏ hết ${detail.itemName}`}>Bỏ hết</button></>}</span></li>)}</ul></div>}
              {invoice.status === 'Pending' && <div className="staff-invoice-card__action staff-invoice-card__action--pending"><label>Thêm món<select value={selectedDishes[invoice._id] || ''} onChange={(event) => setSelectedDishes((current) => ({ ...current, [invoice._id]: event.target.value }))}><option value="">Chọn món</option>{dishes.map((dish) => <option key={dish._id} value={dish._id}>{dish.name} - {formatMoney(dish.price)}</option>)}</select></label><label>Số lượng<input type="number" min="1" max="99" value={quantities[invoice._id] || 1} onChange={(event) => setQuantities((current) => ({ ...current, [invoice._id]: event.target.value }))} /></label><button type="button" className="customer-secondary-button" onClick={() => addDish(invoice)} disabled={busyId === invoice._id}>Thêm món</button>{invoice.depositAmount > 0 && <button type="button" className="customer-secondary-button" onClick={() => showTransferQr(invoice, 'deposit')} disabled={busyId === invoice._id}>Tạo QR tiền cọc</button>}<button type="button" className="customer-primary-button" onClick={() => finalize(invoice)} disabled={busyId === invoice._id}>{busyId === invoice._id ? 'Đang xử lý...' : 'Chốt hóa đơn để thanh toán'}</button>{transferQr[invoice._id] && <div className="invoice-transfer-qr"><img src={transferQr[invoice._id].qrCode} alt="QR tiền cọc" width="240" height="240" /><p>Chuyển {formatMoney(transferQr[invoice._id].amount)} với nội dung <strong>{transferQr[invoice._id].transferContent}</strong>.</p></div>}</div>}
              {invoice.status === 'Finalized' && <div className="staff-invoice-card__action"><label>Phương thức<select value={paymentMethod[invoice._id] || 'Cash'} onChange={(event) => setPaymentMethod((current) => ({ ...current, [invoice._id]: event.target.value }))}><option value="Cash">Tiền mặt</option><option value="BankTransfer">Chuyển khoản</option></select></label>{(paymentMethod[invoice._id] || 'Cash') === 'Cash' && <label>Tiền khách đưa<input type="number" min={invoice.finalAmount} value={cashReceived[invoice._id] || ''} onChange={(event) => setCashReceived((current) => ({ ...current, [invoice._id]: event.target.value }))} /></label>}{paymentMethod[invoice._id] === 'BankTransfer' && <button type="button" className="customer-secondary-button" onClick={() => showTransferQr(invoice)} disabled={busyId === invoice._id}>Tạo QR chuyển khoản</button>}<button type="button" className="customer-primary-button" onClick={() => pay(invoice)} disabled={busyId === invoice._id}>{busyId === invoice._id ? 'Đang thanh toán...' : 'Xác nhận thanh toán'}</button>{transferQr[invoice._id] && paymentMethod[invoice._id] === 'BankTransfer' && <div className="invoice-transfer-qr"><strong>Số tiền chuyển: {formatMoney(transferQr[invoice._id].amount)}</strong><img src={transferQr[invoice._id].qrCode} alt="QR chuyển khoản hóa đơn" width="240" height="240" /><p>Chuyển {formatMoney(transferQr[invoice._id].amount)} với nội dung <strong>{transferQr[invoice._id].transferContent}</strong>.</p></div>}</div>}
            </article>
          ))}
        </div>
      </main>
    </div>
  )
}

export default StaffPaymentsPage
