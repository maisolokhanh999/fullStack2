import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout.jsx'
import UiIcon from '../components/UiIcon.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { getLandingPath, isStaffRole } from '../utils/roleNavigation.js'
import { getInvoiceDetailsByInvoice } from '../services/invoiceDetailService.js'
import { getInvoices } from '../services/invoiceService.js'
import { formatDateTime, formatMoney } from '../components/admin/adminUtils.js'

const roleLabels = {
  admin: 'Quản lý',
  staff: 'Nhân viên',
  user: 'Khách hàng',
}

const statusLabels = {
  Active: 'Đang hoạt động',
  Inactive: 'Chưa kích hoạt',
  Blocked: 'Đã khóa',
}

function DashboardPage() {
  const navigate = useNavigate()
  const {
    user,
    isLoading,
    verificationError: error,
    retryVerification,
    endSession,
  } = useAuth()
  const [paidInvoices, setPaidInvoices] = useState([])
  const [invoiceDetails, setInvoiceDetails] = useState({})
  const [invoiceError, setInvoiceError] = useState('')

  useEffect(() => {
    if (!user || isStaffRole(user.role)) return undefined

    const controller = new AbortController()
    const loadInvoices = async () => {
      try {
        const { invoices } = await getInvoices({ status: 'Paid' }, controller.signal)
        const detailEntries = await Promise.all(invoices.map(async (invoice) => {
          try {
            const result = await getInvoiceDetailsByInvoice(invoice._id, controller.signal)
            return [invoice._id, result.invoiceDetails]
          } catch (requestError) {
            if (requestError.name === 'AbortError') throw requestError
            return [invoice._id, []]
          }
        }))
        if (!controller.signal.aborted) {
          setPaidInvoices(invoices)
          setInvoiceDetails(Object.fromEntries(detailEntries))
        }
      } catch (requestError) {
        if (requestError.name !== 'AbortError') setInvoiceError(requestError.message)
      }
    }

    loadInvoices()
    return () => controller.abort()
  }, [user])

  const logout = () => {
    endSession()
    navigate('/login', { replace: true })
  }

  const accountStatus = user?.status || 'Active'
  const statusClass = accountStatus.toLowerCase()

  return (
    <AuthLayout ariaLabel="Tài khoản Bàn Việt" portalLabel="Tài khoản" wide>
      {isLoading ? (
        <div className="session-loading" role="status" aria-live="polite">
          <span className="spinner" aria-hidden="true" />
          <p>Đang kiểm tra phiên đăng nhập...</p>
        </div>
      ) : error ? (
        <div className="welcome-card verification-error-card">
          <span className="error-state-icon" aria-hidden="true">!</span>
          <span className="section-label">Chưa thể xác minh phiên</span>
          <h1>Kết nối chưa ổn định</h1>
          <p>{error}</p>
          <div className="dashboard-actions">
            <button className="primary-button" type="button" onClick={retryVerification}>
              Thử lại
            </button>
            <button className="secondary-button" type="button" onClick={logout}>
              Đăng xuất
            </button>
          </div>
        </div>
      ) : (
        <div className="welcome-card">
          <div className="dashboard-topline">
            <span className="success-icon"><UiIcon name="check" /></span>
            <a className="dashboard-invoice-link" href="#dashboard-invoices-title">Hóa đơn của tôi</a>
          </div>
          <span className="section-label">Đã xác thực</span>
          <h1>Xin chào, {user?.name || 'bạn'}</h1>
          <p>
            Bạn đang sử dụng tài khoản <strong>{user?.email}</strong>.
          </p>

          <dl className="account-details">
            <div>
              <dt>Vai trò</dt>
              <dd>{roleLabels[user?.role] || user?.role || 'Khách hàng'}</dd>
            </div>
            <div>
              <dt>Trạng thái</dt>
              <dd>
                <span className={`status-dot status-dot--${statusClass}`} />
                {statusLabels[accountStatus] || accountStatus}
              </dd>
            </div>
          </dl>
          <Link className="primary-button link-button" to={getLandingPath(user)}>
            {isStaffRole(user?.role) ? 'Mở màn hình check-in' : 'Khám phá nhà hàng'}
            <UiIcon name="arrow-up-right" className="button-arrow" />
          </Link>
          <button className="secondary-button" type="button" onClick={logout}>
            Đăng xuất
          </button>

          <section className="dashboard-invoices" aria-labelledby="dashboard-invoices-title">
            <div className="dashboard-invoices__heading">
              <div>
                <span className="section-label">Lịch sử thanh toán</span>
                <h2 id="dashboard-invoices-title">Hóa đơn của tôi</h2>
              </div>
              <Link to="/bookings">Xem đặt bàn</Link>
            </div>
            {invoiceError && <p className="dashboard-invoices__error">{invoiceError}</p>}
            {!invoiceError && !paidInvoices.length && <p className="dashboard-invoices__empty">Chưa có hóa đơn đã thanh toán.</p>}
            {paidInvoices.map((invoice) => <article className="dashboard-invoice" key={invoice._id}>
              <div className="dashboard-invoice__top"><strong>Hóa đơn #{invoice._id}</strong><span>Đã thanh toán</span></div>
              <p>{formatDateTime(invoice.paymentDate)} · {invoice.paymentMethod}</p>
              <ul>{(invoiceDetails[invoice._id] || []).map((detail) => <li key={detail._id}><span>{detail.quantity} × {detail.itemName}</span><strong>{formatMoney(detail.totalAmount)}</strong></li>)}</ul>
              <div className="dashboard-invoice__total"><span>Tiền cọc: {formatMoney(invoice.depositAmount)}</span><strong>{formatMoney(invoice.finalAmount)}</strong></div>
            </article>)}
          </section>
        </div>
      )}
    </AuthLayout>
  )
}

export default DashboardPage
