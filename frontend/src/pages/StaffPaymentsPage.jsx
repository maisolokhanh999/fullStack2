import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BrandMark } from '../components/AuthIcons.jsx'
import UiIcon from '../components/UiIcon.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { finalizeInvoice, getInvoices, payInvoice } from '../services/invoiceService.js'
import { formatMoney, labelFor, INVOICE_STATUS_LABELS } from '../components/admin/adminUtils.js'

function StaffPaymentsPage() {
  const navigate = useNavigate()
  const { user, endSession } = useAuth()
  const [invoices, setInvoices] = useState([])
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')
  const [cashReceived, setCashReceived] = useState({})

  useEffect(() => {
    const load = async () => {
      try {
        const result = await getInvoices()
        setInvoices(result.invoices || [])
      } catch (requestError) {
        setError(requestError.message)
      }
    }
    load()
  }, [])

  const logout = () => {
    endSession()
    navigate('/login', { replace: true })
  }

  const pay = async (invoice) => {
    const received = Number(cashReceived[invoice._id])
    if (!Number.isFinite(received) || received < invoice.finalAmount) {
      setError('Tiền khách đưa phải lớn hơn hoặc bằng số tiền cần thanh toán.')
      return
    }
    try {
      setBusyId(invoice._id)
      setError('')
      const updated = await payInvoice(invoice._id, { paymentMethod: 'Cash', cashReceived: received })
      setInvoices((current) => current.map((item) => item._id === invoice._id ? updated : item))
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
              {invoice.status === 'Pending' && <div className="staff-invoice-card__action"><button type="button" className="customer-primary-button" onClick={() => finalize(invoice)} disabled={busyId === invoice._id}>{busyId === invoice._id ? 'Đang chốt...' : 'Chốt hóa đơn để thanh toán'}</button></div>}
              {invoice.status === 'Finalized' && <div className="staff-invoice-card__action"><label>Tiền khách đưa<input type="number" min={invoice.finalAmount} value={cashReceived[invoice._id] || ''} onChange={(event) => setCashReceived((current) => ({ ...current, [invoice._id]: event.target.value }))} /></label><button type="button" className="customer-primary-button" onClick={() => pay(invoice)} disabled={busyId === invoice._id}>{busyId === invoice._id ? 'Đang thanh toán...' : 'Xác nhận thanh toán'}</button></div>}
            </article>
          ))}
        </div>
      </main>
    </div>
  )
}

export default StaffPaymentsPage
