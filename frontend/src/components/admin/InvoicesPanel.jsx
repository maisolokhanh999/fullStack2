import { useState } from 'react'
import { getInvoices, payInvoice, cancelInvoice, refundInvoice } from '../../services/invoiceService.js'
import useAdminCollection from './useAdminCollection.js'
import { AdminPanelEmpty, AdminPanelError, AdminPanelLoading, RowActionError } from './AdminShared.jsx'
import { formatMoney } from './adminUtils.js'

const actions = { Pending: [['Thanh toán', payInvoice], ['Hủy', cancelInvoice]], Paid: [['Hoàn tiền', refundInvoice]] }
export default function InvoicesPanel() {
  const { items, setItems, isLoading, error, retry } = useAdminCollection(getInvoices, 'invoices')
  const [errors, setErrors] = useState({})
  const run = async (id, callback) => { try { const result = await callback(id); setItems((current) => current.map((item) => item._id === id ? { ...item, ...result } : item)) } catch (requestError) { setErrors((current) => ({ ...current, [id]: requestError.message })) } }
  if (isLoading) return <AdminPanelLoading label="Đang tải danh sách hóa đơn..." />
  if (error) return <AdminPanelError message={error} onRetry={retry} />
  if (!items.length) return <AdminPanelEmpty message="Chưa có hóa đơn nào." />
  return <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Người thanh toán</th><th>Điện thoại</th><th>Tổng tiền</th><th>Thành tiền</th><th>Phương thức</th><th>Trạng thái</th><th>Hành động</th></tr></thead><tbody>{items.map((item) => <tr key={item._id}><td>{item.payerName}</td><td>{item.phoneNumber}</td><td>{formatMoney(item.totalAmount)}</td><td>{formatMoney(item.finalAmount)}</td><td>{item.paymentMethod}</td><td><span className="admin-status-badge" data-status={item.status}>{item.status}</span></td><td><div className="admin-action-row">{(actions[item.status] || []).map(([label, callback]) => <button key={label} type="button" className={label !== 'Thanh toán' ? 'admin-btn admin-btn--danger' : 'admin-btn'} onClick={() => (label === 'Thanh toán' || window.confirm(`Xác nhận: ${label}?`)) && run(item._id, callback)}>{label}</button>)}</div><RowActionError message={errors[item._id]} /></td></tr>)}</tbody></table></div>
}
