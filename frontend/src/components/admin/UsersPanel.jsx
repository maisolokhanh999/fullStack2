import { useState } from 'react'
import { getUsers, updateUser, updateUserRole, updateUserPassword, deleteUser } from '../../services/userService.js'
import useAdminCollection from './useAdminCollection.js'
import { AdminPanelEmpty, AdminPanelError, AdminPanelLoading, RowActionError } from './AdminShared.jsx'
import { USER_STATUS_LABELS, formatDateTime, labelFor } from './adminUtils.js'

const roles = { user: 'Khách hàng', staff: 'Nhân viên', admin: 'Quản lý' }
export default function UsersPanel({ currentUser }) {
  const { items, setItems, isLoading, error, retry } = useAdminCollection(getUsers, 'users')
  const [rowErrors, setRowErrors] = useState({})
  const [savingId, setSavingId] = useState(null)
  const action = async (id, task, payload) => {
    setSavingId(id); setRowErrors((current) => ({ ...current, [id]: '' }))
    try {
      if (task === 'delete') { await deleteUser(id); setItems((current) => current.filter((item) => item._id !== id)) }
      if (task === 'role') { const item = await updateUserRole(id, payload); setItems((current) => current.map((value) => value._id === id ? { ...value, ...item } : value)) }
      if (task === 'edit') {
        const name = window.prompt('Họ tên mới:')?.trim()
        const phone = window.prompt('Số điện thoại mới:')?.trim()
        if (!name) throw new Error('Họ tên không được để trống.')
        if (phone && !/^\d{9,10}$/.test(phone)) throw new Error('Số điện thoại cần có 9 đến 10 chữ số.')
        const item = await updateUser(id, { name, phone })
        setItems((current) => current.map((value) => value._id === id ? { ...value, ...item } : value))
      }
      if (task === 'password') {
        const password = window.prompt('Mật khẩu mới:')
        if (!password) throw new Error('Mật khẩu không được để trống.')
        if (password.length < 6) throw new Error('Mật khẩu cần có ít nhất 6 ký tự.')
        await updateUserPassword(id, password)
      }
    } catch (requestError) { setRowErrors((current) => ({ ...current, [id]: requestError.message })) }
    finally { setSavingId(null) }
  }
  if (isLoading) return <AdminPanelLoading label="Đang tải danh sách người dùng..." />
  if (error) return <AdminPanelError message={error} onRetry={retry} />
  if (!items.length) return <AdminPanelEmpty message="Chưa có người dùng nào." />
  return <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Họ tên</th><th>Email</th><th>Điện thoại</th><th>Vai trò</th><th>Trạng thái</th><th>Tạo lúc</th><th>Hành động</th></tr></thead><tbody>{items.map((item) => { const self = item._id === currentUser?._id; const canManage = !self && ['user', 'staff'].includes(item.role); return <tr key={item._id}><td>{item.name}</td><td>{item.email}</td><td>{item.phone || '—'}</td><td>{!canManage ? (roles[item.role] || item.role) : <select value={item.role} disabled={savingId === item._id} onChange={(event) => window.confirm(`Đổi vai trò của "${item.name}" thành "${roles[event.target.value]}"?`) && action(item._id, 'role', event.target.value)}>{Object.entries(roles).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>}</td><td>{labelFor(USER_STATUS_LABELS, item.status)}</td><td>{formatDateTime(item.createdAt)}</td><td>{canManage && <div className="admin-action-row"><button type="button" className="admin-btn" disabled={savingId === item._id} onClick={() => action(item._id, 'edit')}>Sửa</button><button type="button" className="admin-btn" onClick={() => action(item._id, 'password')}>Mật khẩu</button><button type="button" className="admin-btn admin-btn--danger" onClick={() => window.confirm('Xác nhận xóa?') && action(item._id, 'delete')}>Xóa</button></div>}<RowActionError message={rowErrors[item._id]} /></td></tr> })}</tbody></table></div>
}
