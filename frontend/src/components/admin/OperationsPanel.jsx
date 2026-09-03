import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  getReservations, confirmReservation, checkInReservation,
  completeReservation, cancelReservation, markReservationNoShow,
} from '../../services/reservationService.js'
import { getInvoices, finalizeInvoice, payInvoice, cancelInvoice, refundInvoice } from '../../services/invoiceService.js'
import { createInvoiceDetail, getInvoiceDetailsByInvoice } from '../../services/invoiceDetailService.js'
import { getReservationTables } from '../../services/reservationTableService.js'
import { getDishes } from '../../services/dishService.js'
import useAdminCollection from './useAdminCollection.js'
import { AdminPanelEmpty, AdminPanelError, AdminPanelLoading, RowActionError } from './AdminShared.jsx'
import {
  INVOICE_STATUS_LABELS, RESERVATION_STATUS_LABELS,
  formatDateTime, formatMoney, labelFor,
} from './adminUtils.js'

// Vòng đời đặt bàn ở backend: Pending -> Confirmed -> CheckedIn -> Completed.
const reservationActions = {
  Pending: [['Xác nhận', confirmReservation], ['Hủy', cancelReservation]],
  Confirmed: [['Check-in', checkInReservation], ['Không đến', markReservationNoShow], ['Hủy', cancelReservation]],
  CheckedIn: [['Hoàn tất', completeReservation]],
}
const dangerActions = ['Hủy', 'Không đến']

const reservationIdOf = (invoice) => String(invoice?.reservationId?._id || invoice?.reservationId || '')

// Mốc để xếp một lượt đặt: lúc khách bấm đặt, rơi về giờ hẹn nếu bản ghi cũ
// chưa có timestamps. Phải trả về số hợp lệ trong mọi trường hợp — chỉ một
// createdAt hỏng lọt vào là hàm so sánh trả NaN và cả bảng xáo lung tung.
const orderedAt = (reservation) => {
  for (const value of [reservation?.createdAt, reservation?.expectedCheckInTime]) {
    const time = new Date(value ?? '').getTime()
    if (Number.isFinite(time)) return time
  }
  return 0
}

// Backend sắp theo giờ hẹn tăng dần, hợp cho màn hình đón khách nhưng không hợp
// ở đây: lượt đã xong từ mấy hôm trước nằm trên cùng, đơn khách vừa đặt bị đẩy
// xuống tận cuối bảng.
const newestOrderFirst = (reservations) => [...reservations].sort((a, b) => (
  orderedAt(b) - orderedAt(a) || String(b._id).localeCompare(String(a._id))
))

const reservationStatusLabel = (reservation, invoice) => {
  if (['Completed', 'Cancelled', 'NoShow'].includes(reservation.status)) return labelFor(RESERVATION_STATUS_LABELS, reservation.status)
  return invoice?.status === 'Paid' ? 'Đã thanh toán' : 'Chưa thanh toán'
}

/* Hoá đơn của một lượt đặt: phiếu, thêm món khi còn Pending, chốt rồi thanh toán. */
function InvoiceForReservation({ invoice, onInvoiceChange }) {
  const [details, setDetails] = useState([])
  const [tables, setTables] = useState([])
  const [dishes, setDishes] = useState([])
  const [dishId, setDishId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [cashReceived, setCashReceived] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')

  const invoiceId = invoice?._id

  const loadDetails = useCallback(async (signal) => {
    const reservationId = reservationIdOf(invoice)
    const [detailResult, tableResult] = await Promise.all([
      getInvoiceDetailsByInvoice(invoiceId, signal),
      reservationId ? getReservationTables({ reservationId }, signal) : Promise.resolve({ reservationTables: [] }),
    ])
    setDetails(detailResult.invoiceDetails)
    setTables(tableResult.reservationTables.map((entry) => entry.tableId).filter(Boolean))
  }, [invoiceId, invoice])

  useEffect(() => {
    const controller = new AbortController()
    loadDetails(controller.signal).catch((requestError) => {
      if (requestError.name !== 'AbortError') setError(requestError.message)
    })
    return () => controller.abort()
  }, [loadDetails])

  // Danh sách món chỉ cần khi hoá đơn còn cho thêm món.
  useEffect(() => {
    if (invoice.status !== 'Pending') return undefined
    const controller = new AbortController()
    getDishes({ status: 'Available' }, controller.signal)
      .then((result) => setDishes(result.dishes))
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') setError(requestError.message)
      })
    return () => controller.abort()
  }, [invoice.status])

  const runInvoice = async (label, action) => {
    try {
      setBusy(label)
      setError('')
      const updated = await action()
      if (updated) onInvoiceChange(updated)
      await loadDetails()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy('')
    }
  }

  const addDish = (event) => {
    event.preventDefault()
    const parsedQuantity = Number(quantity)
    if (!dishId) {
      setError('Vui lòng chọn món cần thêm.')
      return
    }
    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1 || parsedQuantity > 99) {
      setError('Số lượng phải là số nguyên từ 1 đến 99.')
      return
    }
    runInvoice('add', async () => {
      await createInvoiceDetail({ invoiceId, dishId, quantity: parsedQuantity })
      setDishId('')
      setQuantity(1)
      // Thêm món làm đổi tổng tiền nên phải đọc lại hoá đơn.
      const { invoices } = await getInvoices()
      return invoices.find((item) => item._id === invoiceId)
    })
  }

  const pay = () => {
    const received = Number(cashReceived)
    if (paymentMethod === 'Cash' && (!Number.isFinite(received) || received < invoice.finalAmount)) {
      setError('Vui lòng nhập số tiền mặt đủ để thanh toán.')
      return
    }
    if (!window.confirm(`Xác nhận thanh toán ${formatMoney(invoice.finalAmount)}?`)) return
    runInvoice('pay', () => payInvoice(invoice._id, {
      paymentMethod,
      cashReceived: paymentMethod === 'Cash' ? received : 0,
    }))
  }

  return (
    <div className="admin-invoice">
      <div className="admin-invoice__head">
        <div>
          <span className="admin-invoice__label">Hóa đơn của lượt đặt này</span>
          <strong>{formatMoney(invoice.finalAmount)} còn phải trả</strong>
        </div>
        <span className="admin-status-badge" data-status={invoice.status}>
          {labelFor(INVOICE_STATUS_LABELS, invoice.status)}
        </span>
      </div>

      <div className="invoice-receipt" id="invoice-receipt">
        <header className="invoice-receipt__header">
          <strong>BÀN VIỆT</strong>
          <span>Không gian Việt đương đại</span>
          <h2>HÓA ĐƠN THANH TOÁN</h2>
        </header>
        <div className="invoice-receipt__meta">
          <span>Số HĐ: <strong>{invoice._id}</strong></span>
          <span>Ngày in: {formatDateTime(invoice.paymentDate || invoice.createdAt)}</span>
          <span>Bàn: <strong>{tables.map((table) => table?.tableNumber).filter(Boolean).join(', ') || '—'}</strong></span>
          <span>Khách hàng: {invoice.payerName || '—'}</span>
        </div>
        <table className="invoice-receipt__items">
          <thead><tr><th>TÊN HÀNG</th><th>SL</th><th>ĐƠN GIÁ</th><th>THÀNH TIỀN</th></tr></thead>
          <tbody>{details.map((detail) => (
            <tr key={detail._id}>
              <td>{detail.itemName}</td><td>{detail.quantity}</td>
              <td>{formatMoney(detail.unitPrice)}</td><td>{formatMoney(detail.totalAmount)}</td>
            </tr>
          ))}</tbody>
        </table>
        {!details.length && <p className="invoice-receipt__empty">Chưa có món trong hóa đơn.</p>}
        <div className="invoice-receipt__totals">
          <span>TỔNG CỘNG <strong>{formatMoney(invoice.totalAmount)}</strong></span>
          <span>TIỀN CỌC <strong>{formatMoney(invoice.depositAmount)}</strong></span>
          <span className="invoice-receipt__grand-total">CÒN PHẢI TRẢ <strong>{formatMoney(invoice.finalAmount)}</strong></span>
          <span>PHƯƠNG THỨC <strong>{invoice.paymentMethod}</strong></span>
          {invoice.changeAmount > 0 && <span>TIỀN THỪA <strong>{formatMoney(invoice.changeAmount)}</strong></span>}
        </div>
        <footer>Cảm ơn quý khách. Hẹn gặp lại!</footer>
      </div>

      <RowActionError message={error} />

      {invoice.status === 'Pending' && (
        <div className="admin-invoice__work">
          <h4>Thêm món khách gọi tại bàn</h4>
          <form className="admin-order-form" onSubmit={addDish}>
            <label className="admin-field">
              <span>Món</span>
              <select value={dishId} onChange={(event) => setDishId(event.target.value)} required>
                <option value="">Chọn món</option>
                {dishes.map((dish) => (
                  <option key={dish._id} value={dish._id}>{dish.name} — {formatMoney(dish.price)}</option>
                ))}
              </select>
            </label>
            <label className="admin-field admin-field--narrow">
              <span>Số lượng</span>
              <input type="number" min="1" max="99" value={quantity}
                onChange={(event) => setQuantity(event.target.value)} required />
            </label>
            <button type="submit" className="admin-btn admin-btn--primary" disabled={busy === 'add'}>
              {busy === 'add' ? 'Đang thêm...' : 'Thêm món'}
            </button>
          </form>
          <div className="admin-action-row">
            <button type="button" className="admin-btn admin-btn--primary" disabled={Boolean(busy)}
              onClick={() => window.confirm('Chốt hóa đơn? Sau khi chốt sẽ không thể thêm món.')
                && runInvoice('finalize', () => finalizeInvoice(invoice._id))}>
              Chốt hóa đơn
            </button>
            <button type="button" className="admin-btn admin-btn--danger" disabled={Boolean(busy)}
              onClick={() => window.confirm('Hủy hóa đơn này?') && runInvoice('cancel', () => cancelInvoice(invoice._id))}>
              Hủy hóa đơn
            </button>
          </div>
        </div>
      )}

      {invoice.status === 'Finalized' && (
        <div className="admin-invoice__work">
          <h4>Thanh toán</h4>
          {/* Cùng là ô nhập của khu hoá đơn nên dùng chung thẻ với ô thêm món,
              không để hai bước liền nhau của một luồng lại khác kiểu. */}
          <div className="admin-order-form">
            <label className="admin-field">
              <span>Phương thức</span>
              <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
                <option value="Cash">Tiền mặt</option>
                <option value="BankTransfer">Chuyển khoản</option>
                <option value="Card">Thẻ</option>
                <option value="EWallet">Ví điện tử</option>
              </select>
            </label>
            {paymentMethod === 'Cash' && (
              <label className="admin-field">
                <span>Tiền khách đưa</span>
                <input type="number" min={invoice.finalAmount} value={cashReceived}
                  onChange={(event) => setCashReceived(event.target.value)} />
              </label>
            )}
            <button type="button" className="admin-btn admin-btn--primary" onClick={pay} disabled={busy === 'pay'}>
              {busy === 'pay' ? 'Đang thanh toán...' : `Thanh toán ${formatMoney(invoice.finalAmount)}`}
            </button>
          </div>
        </div>
      )}

      {invoice.status === 'Paid' && (
        <div className="admin-action-row">
          <button type="button" className="admin-btn" onClick={() => window.print()}>In hóa đơn</button>
          <button type="button" className="admin-btn admin-btn--danger" disabled={Boolean(busy)}
            onClick={() => window.confirm('Hoàn tiền hóa đơn này?') && runInvoice('refund', () => refundInvoice(invoice._id))}>
            Hoàn tiền
          </button>
        </div>
      )}
    </div>
  )
}

export default function OperationsPanel() {
  const reservations = useAdminCollection(getReservations, 'reservations')
  const invoices = useAdminCollection(getInvoices, 'invoices')
  const [openId, setOpenId] = useState('')
  const [errors, setErrors] = useState({})
  const orderedReservations = useMemo(() => newestOrderFirst(reservations.items), [reservations.items])

  const runReservation = async (id, action) => {
    try {
      const updated = await action(id)
      reservations.setItems((current) => current.map((item) => (item._id === id ? { ...item, ...updated } : item)))
      setErrors((current) => ({ ...current, [id]: '' }))
    } catch (requestError) {
      setErrors((current) => ({ ...current, [id]: requestError.message }))
    }
  }

  const replaceInvoice = (updated) => invoices.setItems((current) => (
    current.map((item) => (item._id === updated._id ? { ...item, ...updated } : item))
  ))

  if (reservations.isLoading || invoices.isLoading) {
    return <AdminPanelLoading label="Đang tải dữ liệu vận hành..." />
  }
  if (reservations.error) return <AdminPanelError message={reservations.error} onRetry={reservations.retry} />
  if (invoices.error) return <AdminPanelError message={invoices.error} onRetry={invoices.retry} />
  if (!reservations.items.length) return <AdminPanelEmpty message="Chưa có lượt đặt bàn nào." />

  return (
    <div className="admin-ops">
      <p className="admin-ops__hint">
        Mỗi lượt đặt bàn sinh sẵn một hóa đơn. Bấm vào một dòng để mở hóa đơn của lượt đó,
        thêm món khách gọi thêm, rồi chốt và thanh toán.
      </p>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Mã đặt bàn</th><th>Khách</th><th>Điện thoại</th><th>Số khách</th>
              <th>Người đặt bàn</th><th>Đặt lúc</th><th>Giờ hẹn</th><th>Trạng thái</th><th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {orderedReservations.map((item) => {
              const invoice = invoices.items.find((entry) => reservationIdOf(entry) === item._id)
              const isOpen = openId === item._id
              return [
                <tr key={item._id} className={isOpen ? 'is-open' : undefined}>
                  <td><code>{item.reservationCode || '—'}</code></td>
                  <td>{item.customerName}</td>
                  <td>{item.customerPhone}</td>
                  <td>{item.numberOfGuests}</td>
                  <td>{item.bookedBy?.name || item.customerName}</td>
                  <td className="admin-cell--time">{formatDateTime(item.createdAt)}</td>
                  <td className="admin-cell--time">{formatDateTime(item.expectedCheckInTime)}</td>
                  <td>
                    <span className="admin-status-badge" data-status={item.status}>
                      {reservationStatusLabel(item, invoice)}
                    </span>
                  </td>
                  <td>
                    <div className="admin-action-row">
                      {invoice && <button type="button" className="admin-btn admin-btn--link" aria-expanded={isOpen} onClick={() => setOpenId(isOpen ? '' : item._id)}>{isOpen ? 'Đóng hóa đơn' : 'Xem hóa đơn'}</button>}
                      {(reservationActions[item.status] || []).map(([label, action]) => (
                        <button key={label} type="button"
                          className={dangerActions.includes(label) ? 'admin-btn admin-btn--danger' : 'admin-btn'}
                          onClick={() => (dangerActions.includes(label) ? window.confirm(`Xác nhận: ${label}?`) : true)
                            && runReservation(item._id, action)}>
                          {label}
                        </button>
                      ))}
                    </div>
                    <RowActionError message={errors[item._id]} />
                  </td>
                </tr>,
                isOpen && invoice ? (
                  <tr key={`${item._id}-invoice`} className="admin-table__expand">
                    <td colSpan={9}>
                      <InvoiceForReservation invoice={invoice} onInvoiceChange={replaceInvoice} />
                    </td>
                  </tr>
                ) : null,
              ]
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
