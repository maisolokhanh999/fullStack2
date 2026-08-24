import { useEffect, useState } from 'react'
import { finalizeInvoice, getInvoiceById, getInvoices, payInvoice } from '../../services/invoiceService.js'
import { createInvoiceDetail, getInvoiceDetailsByInvoice } from '../../services/invoiceDetailService.js'
import { getDishes } from '../../services/dishService.js'
import { getReservationTables } from '../../services/reservationTableService.js'
import useAdminCollection from './useAdminCollection.js'
import { AdminPanelError, AdminPanelLoading } from './AdminShared.jsx'
import { formatMoney } from './adminUtils.js'

export default function InvoiceDetailsPanel() {
  const { items, isLoading, error: listError, retry } = useAdminCollection(getInvoices, 'invoices')
  const [id, setId] = useState('')
  const [invoice, setInvoice] = useState(null)
  const [details, setDetails] = useState([])
  const [reservationTables, setReservationTables] = useState([])
  const [dishes, setDishes] = useState([])
  const [dishId, setDishId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [cashReceived, setCashReceived] = useState('')
  const [lookupError, setLookupError] = useState('')
  const [actionError, setActionError] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [isPaying, setIsPaying] = useState(false)

  useEffect(() => {
    getDishes({ status: 'Available' }).then(({ dishes: availableDishes }) => setDishes(availableDishes)).catch(() => setDishes([]))
  }, [])

  const loadInvoiceData = async (invoiceId) => {
    const invoiceData = await getInvoiceById(invoiceId)
    const reservationId = invoiceData.reservationId?._id || invoiceData.reservationId
    const [detailData, tableData] = await Promise.all([
      getInvoiceDetailsByInvoice(invoiceId),
      getReservationTables({ reservationId }),
    ])
    setInvoice(invoiceData)
    setDetails(detailData.invoiceDetails)
    setReservationTables(tableData.reservationTables.map((entry) => entry.tableId))
  }

  const lookup = async (event) => {
    event.preventDefault()
    if (!id) return
    try {
      setLookupError('')
      setActionError('')
      await loadInvoiceData(id)
    } catch (requestError) {
      setInvoice(null)
      setDetails([])
      setLookupError(requestError.message)
    }
  }

  const addDish = async (event) => {
    event.preventDefault()
    if (!invoice || !dishId) return
    try {
      setIsAdding(true)
      setActionError('')
      await createInvoiceDetail({ invoiceId: invoice._id, dishId, quantity: Number(quantity) })
      setDishId('')
      setQuantity(1)
      await loadInvoiceData(invoice._id)
    } catch (requestError) {
      setActionError(requestError.message)
    } finally {
      setIsAdding(false)
    }
  }

  const pay = async () => {
    const received = Number(cashReceived)
    if (!invoice || (paymentMethod === 'Cash' && (!Number.isFinite(received) || received < invoice.finalAmount))) {
      setActionError('Vui lòng nhập số tiền mặt đủ để thanh toán.')
      return
    }
    if (!window.confirm(`Xác nhận thanh toán ${formatMoney(invoice.finalAmount)}?`)) return
    try {
      setIsPaying(true)
      setActionError('')
      await payInvoice(invoice._id, { paymentMethod, cashReceived: paymentMethod === 'Cash' ? received : 0 })
      await loadInvoiceData(invoice._id)
    } catch (requestError) {
      setActionError(requestError.message)
    } finally {
      setIsPaying(false)
    }
  }

  const finalize = async () => {
    if (!invoice || !window.confirm('Chốt hóa đơn? Sau khi chốt sẽ không thể thêm hoặc sửa món.')) return
    try {
      setActionError('')
      await finalizeInvoice(invoice._id)
      await loadInvoiceData(invoice._id)
    } catch (requestError) {
      setActionError(requestError.message)
    }
  }

  if (isLoading) return <AdminPanelLoading label="Đang tải danh sách hóa đơn..." />
  if (listError) return <AdminPanelError message={listError} onRetry={retry} />
  return <div className="admin-lookup-panel">
    <form className="admin-action-row" onSubmit={lookup}>
      <select value={id} onChange={(event) => setId(event.target.value)} required>
        <option value="">Chọn mã hóa đơn</option>
        {items.map((item) => <option key={item._id} value={item._id}>{item._id} - {item.payerName || 'Không có tên'}</option>)}
      </select>
      <button type="submit" className="admin-btn">Tra cứu</button>
    </form>
    {lookupError && <p className="admin-row-error">{lookupError}</p>}
    {actionError && <p className="admin-row-error">{actionError}</p>}
    {invoice && <>
      <div className="invoice-receipt" id="invoice-receipt">
        <header className="invoice-receipt__header">
          <strong>BÀN VIỆT</strong>
          <span>{'Không gian Việt đương đại'}</span>
          <span>{'Địa chỉ đang được cập nhật'}</span>
          <h2>HÓA ĐƠN THANH TOÁN</h2>
        </header>
        <div className="invoice-receipt__meta">
          <span>Số HĐ: <strong>{invoice._id}</strong></span>
          <span>Ngày in: {new Date(invoice.paymentDate || invoice.createdAt).toLocaleString('vi-VN')}</span>
          <span>Bàn: <strong>{reservationTables.map((table) => table?.tableNumber).filter(Boolean).join(', ') || '—'}</strong></span>
          <span>Thu ngân: <strong>ADMIN</strong></span>
          <span>Khách hàng: {invoice.payerName || '—'}</span>
        </div>
        <table className="invoice-receipt__items"><thead><tr><th>TÊN HÀNG</th><th>SL</th><th>ĐƠN GIÁ</th><th>THÀNH TIỀN</th></tr></thead><tbody>{details.map((detail) => <tr key={detail._id}><td>{detail.itemName}</td><td>{detail.quantity}</td><td>{formatMoney(detail.unitPrice)}</td><td>{formatMoney(detail.totalAmount)}</td></tr>)}</tbody></table>
        {!details.length && <p className="invoice-receipt__empty">Chưa có món trong hóa đơn.</p>}
        <div className="invoice-receipt__totals">
          <span>TỔNG CỘNG <strong>{formatMoney(invoice.totalAmount)}</strong></span>
          <span>TIỀN CỌC <strong>{formatMoney(invoice.depositAmount)}</strong></span>
          <span className="invoice-receipt__grand-total">CÒN PHẢI TRẢ <strong>{formatMoney(invoice.finalAmount)}</strong></span>
          <span>PHƯƠNG THỨC <strong>{invoice.paymentMethod}</strong></span>
          {invoice.changeAmount > 0 && <span>TIỀN THỪA <strong>{formatMoney(invoice.changeAmount)}</strong></span>}
          {invoice.status === 'Cancelled' && <span className="invoice-receipt__cancelled">LÝ DO HỦY <strong>{invoice.cancellationReason || 'Đặt bàn đã bị hủy'}</strong></span>}
          {invoice.status === 'Cancelled' && <span className="invoice-receipt__cancelled">HOÀN CỌC <strong>Không hoàn lại</strong></span>}
        </div>
        <footer>Cảm ơn quý khách. Hẹn gặp lại!</footer>
      </div>
      <div className="admin-action-row invoice-receipt-actions"><button type="button" className="admin-btn" onClick={() => window.print()}>In hóa đơn</button></div>
      {invoice.status === 'Pending' && <>
        <h3>Thêm món ăn</h3>
        <form className="admin-action-row" onSubmit={addDish}>
          <select value={dishId} onChange={(event) => setDishId(event.target.value)} required><option value="">Chọn món</option>{dishes.map((dish) => <option key={dish._id} value={dish._id}>{dish.name} - {formatMoney(dish.price)}</option>)}</select>
          <input type="number" min="1" max="99" value={quantity} onChange={(event) => setQuantity(event.target.value)} aria-label="Số lượng món" required />
          <button type="submit" className="admin-btn" disabled={isAdding}>{isAdding ? 'Đang thêm...' : 'Thêm món'}</button>
        </form>
        <button type="button" className="admin-btn" onClick={finalize}>Chốt hóa đơn</button>
      </>}
      {invoice.status === 'Finalized' && <div className="admin-action-row">
        <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} aria-label="Phương thức thanh toán">
          <option value="Cash">Tiền mặt</option>
          <option value="BankTransfer">Chuyển khoản</option>
          <option value="Card">Thẻ</option>
          <option value="EWallet">Ví điện tử</option>
        </select>
        {paymentMethod === 'Cash' && <input type="number" min={invoice.finalAmount} value={cashReceived} onChange={(event) => setCashReceived(event.target.value)} placeholder="Tiền khách đưa" aria-label="Tiền khách đưa" />}
        <button type="button" className="admin-btn" onClick={pay} disabled={isPaying}>{isPaying ? 'Đang thanh toán...' : `Thanh toán ${formatMoney(invoice.finalAmount)}`}</button>
      </div>}
    </>}
  </div>
}
