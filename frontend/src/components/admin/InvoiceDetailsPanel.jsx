import { useState } from 'react'
import { getInvoiceById, getInvoices } from '../../services/invoiceService.js'
import useAdminCollection from './useAdminCollection.js'
import { AdminPanelError, AdminPanelLoading } from './AdminShared.jsx'

export default function InvoiceDetailsPanel() {
  const { items, isLoading, error: listError, retry } = useAdminCollection(getInvoices, 'invoices')
  const [id, setId] = useState(''); const [invoice, setInvoice] = useState(null); const [lookupError, setLookupError] = useState('')
  const lookup = async (event) => { event.preventDefault(); if (!id) return; try { setLookupError(''); setInvoice(await getInvoiceById(id)) } catch (requestError) { setInvoice(null); setLookupError(requestError.message) } }
  if (isLoading) return <AdminPanelLoading label="Đang tải danh sách hóa đơn..." />
  if (listError) return <AdminPanelError message={listError} onRetry={retry} />
  return <div className="admin-lookup-panel"><form className="admin-action-row" onSubmit={lookup}><select value={id} onChange={(event) => setId(event.target.value)} required><option value="">Chọn mã hóa đơn</option>{items.map((item) => <option key={item._id} value={item._id}>{item._id} - {item.payerName || 'Không có tên'}</option>)}</select><button type="submit" className="admin-btn">Tra cứu</button></form>{lookupError && <p className="admin-row-error">{lookupError}</p>}{invoice && <dl className="admin-detail-list">{[['Mã hóa đơn', invoice._id], ['Người thanh toán', invoice.payerName], ['Điện thoại', invoice.phoneNumber], ['Tổng tiền', invoice.totalAmount], ['Thành tiền', invoice.finalAmount], ['Phương thức', invoice.paymentMethod], ['Trạng thái', invoice.status]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value ?? '—'}</dd></div>)}</dl>}</div>
}
