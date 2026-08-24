import { useState } from 'react'
import { getReservations, confirmReservation, checkInReservation, completeReservation, cancelReservation, markReservationNoShow } from '../../services/reservationService.js'
import useAdminCollection from './useAdminCollection.js'
import { AdminPanelEmpty, AdminPanelError, AdminPanelLoading, RowActionError } from './AdminShared.jsx'
import { formatDateTime, formatMoney } from './adminUtils.js'

const actions = { Pending: [['Xác nhận', confirmReservation], ['Hủy', cancelReservation]], Confirmed: [['Check-in', checkInReservation], ['Không đến', markReservationNoShow], ['Hủy', cancelReservation]], CheckedIn: [['Hoàn tất', completeReservation]] }
export default function ReservationsPanel() {
  const { items, setItems, isLoading, error, retry } = useAdminCollection(getReservations, 'reservations')
  const [errors, setErrors] = useState({})
  const run = async (id, callback) => { try { const result = await callback(id); setItems((current) => current.map((item) => item._id === id ? { ...item, ...result } : item)) } catch (requestError) { setErrors((current) => ({ ...current, [id]: requestError.message })) } }
  if (isLoading) return <AdminPanelLoading label="Đang tải danh sách đặt bàn..." />
  if (error) return <AdminPanelError message={error} onRetry={retry} />
  if (!items.length) return <AdminPanelEmpty message="Chưa có lượt đặt bàn nào." />
  return <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Khách</th><th>Điện thoại</th><th>Số khách</th><th>Tiền cọc</th><th>Giờ hẹn</th><th>Loại</th><th>Trạng thái</th><th>Hành động</th></tr></thead><tbody>{items.map((item) => <tr key={item._id}><td>{item.customerName}</td><td>{item.customerPhone}</td><td>{item.numberOfGuests}</td><td>{formatMoney(item.depositAmount)}</td><td>{formatDateTime(item.expectedCheckInTime)}</td><td>{item.reservationType}</td><td><span className="admin-status-badge" data-status={item.status}>{item.status}</span></td><td><div className="admin-action-row">{(actions[item.status] || []).map(([label, callback]) => <button key={label} type="button" className={label === 'Hủy' || label === 'Không đến' ? 'admin-btn admin-btn--danger' : 'admin-btn'} onClick={() => (!['Xác nhận', 'Check-in', 'Hoàn tất'].includes(label) ? window.confirm(`Xác nhận: ${label}?`) : true) && run(item._id, callback)}>{label}</button>)}</div><RowActionError message={errors[item._id]} /></td></tr>)}</tbody></table></div>
}
