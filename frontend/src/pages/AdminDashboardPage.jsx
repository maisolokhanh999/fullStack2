import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BrandMark } from '../components/AuthIcons.jsx'
import UiIcon from '../components/UiIcon.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { getUsers, updateUserRole } from '../services/userService.js'
import {
  getReservations,
  confirmReservation,
  checkInReservation,
  completeReservation,
  cancelReservation,
  markReservationNoShow,
} from '../services/reservationService.js'
import { getInvoices, payInvoice, cancelInvoice, refundInvoice } from '../services/invoiceService.js'

const TABS = [
  { id: 'users', label: 'Người dùng' },
  { id: 'reservations', label: 'Đặt bàn' },
  { id: 'invoices', label: 'Hóa đơn' },
]

const ROLE_LABELS = { admin: 'Quản lý', staff: 'Nhân viên', user: 'Khách hàng' }
const ROLE_OPTIONS = ['user', 'staff', 'admin']

const STATUS_LABELS = { Active: 'Đang hoạt động', Inactive: 'Chưa kích hoạt', Blocked: 'Đã khóa' }

const RESERVATION_STATUS_LABELS = {
  Pending: 'Chờ xác nhận',
  Confirmed: 'Đã xác nhận',
  CheckedIn: 'Đã check-in',
  Completed: 'Hoàn tất',
  Cancelled: 'Đã hủy',
  NoShow: 'Không đến',
}

const INVOICE_STATUS_LABELS = {
  Pending: 'Chờ thanh toán',
  Paid: 'Đã thanh toán',
  Cancelled: 'Đã hủy',
  Refunded: 'Đã hoàn tiền',
}

const formatDateTime = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('vi-VN')
}

const formatMoney = (value) =>
  typeof value === 'number' ? `${value.toLocaleString('vi-VN')}đ` : '—'

function useAdminCollection(loader, key) {
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [requestId, setRequestId] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    const load = async () => {
      try {
        setIsLoading(true)
        setError('')
        const result = await loader(controller.signal)
        setItems(result[key] || [])
      } catch (requestError) {
        if (requestError.name !== 'AbortError') {
          setItems([])
          setError(requestError.message)
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    load()
    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId])

  const retry = useCallback(() => setRequestId((value) => value + 1), [])

  return { items, setItems, isLoading, error, retry }
}

function RowActionError({ message }) {
  if (!message) return null
  return <p className="admin-row-error">{message}</p>
}

function UsersPanel() {
  const { user: currentUser } = useAuth()
  const { items, setItems, isLoading, error, retry } = useAdminCollection(getUsers, 'users')
  const [rowErrors, setRowErrors] = useState({})
  const [savingId, setSavingId] = useState(null)

  const handleRoleChange = async (id, role, name) => {
    const confirmed = window.confirm(`Đổi vai trò của "${name}" thành "${ROLE_LABELS[role]}"?`)
    if (!confirmed) return

    setSavingId(id)
    setRowErrors((prev) => ({ ...prev, [id]: '' }))
    try {
      const updated = await updateUserRole(id, role)
      setItems((prev) => prev.map((item) => (item._id === id ? { ...item, ...updated } : item)))
    } catch (requestError) {
      setRowErrors((prev) => ({ ...prev, [id]: requestError.message }))
    } finally {
      setSavingId(null)
    }
  }

  if (isLoading) return <AdminPanelLoading label="Đang tải danh sách người dùng..." />
  if (error) return <AdminPanelError message={error} onRetry={retry} />
  if (items.length === 0) return <AdminPanelEmpty message="Chưa có người dùng nào." />

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Họ tên</th>
            <th>Email</th>
            <th>Điện thoại</th>
            <th>Vai trò</th>
            <th>Trạng thái</th>
            <th>Tạo lúc</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const isSelf = item._id === currentUser?._id

            return (
            <tr key={item._id}>
              <td>{item.name}</td>
              <td>{item.email}</td>
              <td>{item.phone ?? '—'}</td>
              <td>
                <select
                  value={item.role}
                  disabled={isSelf || savingId === item._id}
                  onChange={(event) => handleRoleChange(item._id, event.target.value, item.name)}
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>{ROLE_LABELS[role]}</option>
                  ))}
                </select>
                {isSelf && <p className="admin-muted">Không thể tự đổi vai trò của chính mình.</p>}
                <RowActionError message={rowErrors[item._id]} />
              </td>
              <td>
                <span className={`status-dot status-dot--${String(item.status || 'active').toLowerCase()}`} />
                {STATUS_LABELS[item.status] || item.status || '—'}
              </td>
              <td>{formatDateTime(item.createdAt)}</td>
            </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

const RESERVATION_ACTIONS = {
  Pending: [
    { action: 'confirm', label: 'Xác nhận', run: confirmReservation },
    { action: 'cancel', label: 'Hủy', run: cancelReservation, danger: true },
  ],
  Confirmed: [
    { action: 'checkin', label: 'Check-in', run: checkInReservation },
    { action: 'no-show', label: 'Không đến', run: markReservationNoShow, danger: true },
    { action: 'cancel', label: 'Hủy', run: cancelReservation, danger: true },
  ],
  CheckedIn: [
    { action: 'complete', label: 'Hoàn tất', run: completeReservation },
  ],
}

function ReservationsPanel() {
  const { items, setItems, isLoading, error, retry } = useAdminCollection(getReservations, 'reservations')
  const [rowErrors, setRowErrors] = useState({})
  const [savingId, setSavingId] = useState(null)

  const runAction = async (id, action, run, label, danger) => {
    if (danger && !window.confirm(`Xác nhận: ${label}?`)) return

    setSavingId(`${id}:${action}`)
    setRowErrors((prev) => ({ ...prev, [id]: '' }))
    try {
      const updated = await run(id)
      setItems((prev) => prev.map((item) => (item._id === id ? { ...item, ...updated } : item)))
    } catch (requestError) {
      setRowErrors((prev) => ({ ...prev, [id]: requestError.message }))
    } finally {
      setSavingId(null)
    }
  }

  if (isLoading) return <AdminPanelLoading label="Đang tải danh sách đặt bàn..." />
  if (error) return <AdminPanelError message={error} onRetry={retry} />
  if (items.length === 0) return <AdminPanelEmpty message="Chưa có lượt đặt bàn nào." />

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Khách</th>
            <th>Điện thoại</th>
            <th>Số khách</th>
            <th>Giờ hẹn</th>
            <th>Loại</th>
            <th>Trạng thái</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item._id}>
              <td>{item.customerName}</td>
              <td>{item.customerPhone}</td>
              <td>{item.numberOfGuests}</td>
              <td>{formatDateTime(item.expectedCheckInTime)}</td>
              <td>{item.reservationType}</td>
              <td>
                <span className="admin-status-badge" data-status={item.status}>
                  {RESERVATION_STATUS_LABELS[item.status] || item.status}
                </span>
              </td>
              <td>
                <div className="admin-action-row">
                  {(RESERVATION_ACTIONS[item.status] || []).map(({ action, label, run, danger }) => (
                    <button
                      key={action}
                      type="button"
                      className={danger ? 'admin-btn admin-btn--danger' : 'admin-btn'}
                      disabled={savingId === `${item._id}:${action}`}
                      onClick={() => runAction(item._id, action, run, label, danger)}
                    >
                      {label}
                    </button>
                  ))}
                  {!(RESERVATION_ACTIONS[item.status] || []).length && <span className="admin-muted">—</span>}
                </div>
                <RowActionError message={rowErrors[item._id]} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const INVOICE_ACTIONS = {
  Pending: [
    { action: 'pay', label: 'Thanh toán', run: payInvoice },
    { action: 'cancel', label: 'Hủy', run: cancelInvoice, danger: true },
  ],
  Paid: [
    { action: 'refund', label: 'Hoàn tiền', run: refundInvoice, danger: true },
  ],
}

function InvoicesPanel() {
  const { items, setItems, isLoading, error, retry } = useAdminCollection(getInvoices, 'invoices')
  const [rowErrors, setRowErrors] = useState({})
  const [savingId, setSavingId] = useState(null)

  const runAction = async (id, action, run, label, danger) => {
    if (danger && !window.confirm(`Xác nhận: ${label}?`)) return

    setSavingId(`${id}:${action}`)
    setRowErrors((prev) => ({ ...prev, [id]: '' }))
    try {
      const updated = await run(id)
      setItems((prev) => prev.map((item) => (item._id === id ? { ...item, ...updated } : item)))
    } catch (requestError) {
      setRowErrors((prev) => ({ ...prev, [id]: requestError.message }))
    } finally {
      setSavingId(null)
    }
  }

  if (isLoading) return <AdminPanelLoading label="Đang tải danh sách hóa đơn..." />
  if (error) return <AdminPanelError message={error} onRetry={retry} />
  if (items.length === 0) return <AdminPanelEmpty message="Chưa có hóa đơn nào." />

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Người thanh toán</th>
            <th>Điện thoại</th>
            <th>Tổng tiền</th>
            <th>Thành tiền</th>
            <th>Phương thức</th>
            <th>Trạng thái</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item._id}>
              <td>{item.payerName}</td>
              <td>{item.phoneNumber}</td>
              <td>{formatMoney(item.totalAmount)}</td>
              <td>{formatMoney(item.finalAmount)}</td>
              <td>{item.paymentMethod}</td>
              <td>
                <span className="admin-status-badge" data-status={item.status}>
                  {INVOICE_STATUS_LABELS[item.status] || item.status}
                </span>
              </td>
              <td>
                <div className="admin-action-row">
                  {(INVOICE_ACTIONS[item.status] || []).map(({ action, label, run, danger }) => (
                    <button
                      key={action}
                      type="button"
                      className={danger ? 'admin-btn admin-btn--danger' : 'admin-btn'}
                      disabled={savingId === `${item._id}:${action}`}
                      onClick={() => runAction(item._id, action, run, label, danger)}
                    >
                      {label}
                    </button>
                  ))}
                  {!(INVOICE_ACTIONS[item.status] || []).length && <span className="admin-muted">—</span>}
                </div>
                <RowActionError message={rowErrors[item._id]} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function AdminPanelLoading({ label }) {
  return (
    <div className="menu-state" role="status">
      <span className="spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  )
}

function AdminPanelError({ message, onRetry }) {
  return (
    <div className="menu-state menu-state--error" role="alert">
      <strong>Chưa tải được dữ liệu</strong>
      <p>{message}</p>
      <button type="button" className="outline-action" onClick={onRetry}>Thử lại</button>
    </div>
  )
}

function AdminPanelEmpty({ message }) {
  return (
    <div className="menu-state">
      <p>{message}</p>
    </div>
  )
}

function AdminDashboardPage() {
  const navigate = useNavigate()
  const { user, endSession } = useAuth()
  const [activeTab, setActiveTab] = useState('users')

  const logout = () => {
    endSession()
    navigate('/login', { replace: true })
  }

  return (
    <div className="admin-app">
      <header className="staff-header">
        <div className="staff-header__inner">
          <Link className="site-brand" to="/restaurants" aria-label="Bàn Việt - Về trang nhà hàng">
            <BrandMark />
            <span>Bàn Việt</span>
          </Link>
          <span className="staff-portal-label">Cổng quản trị</span>
          <nav>
            <Link to="/restaurants">Trang nhà hàng</Link>
            <Link to="/dashboard">{user?.name || 'Tài khoản'}</Link>
            <button type="button" onClick={logout}>Đăng xuất</button>
          </nav>
        </div>
      </header>

      <main className="customer-main admin-page">
        <section className="admin-hero">
          <span className="customer-kicker">Bảng điều khiển</span>
          <h1>Quản trị hệ thống</h1>
          <p>Theo dõi người dùng, lượt đặt bàn và hóa đơn trên toàn hệ thống.</p>
        </section>

        <div className="admin-security-notice" role="alert">
          <span><UiIcon name="info" /></span>
          <p>
            API <code>/users</code>, <code>/reservations</code> và <code>/invoices</code> hiện chưa được
            backend gắn xác thực — dữ liệu ở đây có thể bị gọi trực tiếp mà không cần đăng nhập qua trang
            này. Đây là giới hạn đã biết, chưa phải lỗi của trang quản trị.
          </p>
        </div>

        <div className="admin-tabs" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={activeTab === tab.id ? 'admin-tab is-active' : 'admin-tab'}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'users' && <UsersPanel />}
        {activeTab === 'reservations' && <ReservationsPanel />}
        {activeTab === 'invoices' && <InvoicesPanel />}
      </main>
    </div>
  )
}

export default AdminDashboardPage
