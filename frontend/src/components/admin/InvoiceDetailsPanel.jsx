import { useEffect, useState } from 'react'
import { finalizeInvoice, getInvoiceById, getInvoices, payInvoice } from '../../services/invoiceService.js'
import { createInvoiceDetail, getInvoiceDetailsByInvoice } from '../../services/invoiceDetailService.js'
import { getDishes } from '../../services/dishService.js'
import useAdminCollection from './useAdminCollection.js'
import { AdminPanelError, AdminPanelLoading } from './AdminShared.jsx'
import { formatMoney } from './adminUtils.js'

export default function InvoiceDetailsPanel() {
  const { items, isLoading, error: listError, retry } = useAdminCollection(getInvoices, 'invoices')
  const [id, setId] = useState('')
  const [invoice, setInvoice] = useState(null)
  const [details, setDetails] = useState([])
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
    const [invoiceData, detailData] = await Promise.all([
      getInvoiceById(invoiceId),
      getInvoiceDetailsByInvoice(invoiceId),
    ])
    setInvoice(invoiceData)
    setDetails(detailData.invoiceDetails)
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
      <dl className="admin-detail-list">
        {[['Mã hóa đơn', invoice._id], ['Người thanh toán', invoice.payerName], ['Điện thoại', invoice.phoneNumber], ['Tổng tiền món', formatMoney(invoice.totalAmount)], ['Tiền cọc', formatMoney(invoice.depositAmount)], ['Còn phải trả', formatMoney(invoice.finalAmount)], ['Phương thức', invoice.paymentMethod], ['Trạng thái', invoice.status]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value ?? '—'}</dd></div>)}
      </dl>
      <h3>Món trong hóa đơn</h3>
      {details.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Món</th><th>Đơn giá</th><th>Số lượng</th><th>Thành tiền</th></tr></thead><tbody>{details.map((detail) => <tr key={detail._id}><td>{detail.itemName}</td><td>{formatMoney(detail.unitPrice)}</td><td>{detail.quantity}</td><td>{formatMoney(detail.totalAmount)}</td></tr>)}</tbody></table></div> : <p>Chưa có món trong hóa đơn.</p>}
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
