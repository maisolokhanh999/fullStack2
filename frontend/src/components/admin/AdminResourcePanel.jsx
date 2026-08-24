import { useState } from 'react'
import useAdminCollection from './useAdminCollection.js'
import { AdminPanelEmpty, AdminPanelError, AdminPanelLoading } from './AdminShared.jsx'
import { uploadFile } from '../../services/uploadService.js'

const emptyCategories = async () => ({ categories: [] })

const fieldLabel = (field) => ({
  categoryId: 'Mã danh mục', tableNumber: 'Số bàn', servingUnit: 'Đơn vị',
  startDate: 'Ngày bắt đầu', endDate: 'Ngày kết thúc',
}[field] || field)

const displayValue = (value) => {
  if (value === undefined || value === null || value === '') return '—'
  if (typeof value !== 'object') return value
  return value.reservationCode || value.tableNumber || value.name || value._id || '—'
}

function ResourceForm({ config, initial, onCancel, onSubmit }) {
  const fields = config.fields || []
  const [form, setForm] = useState(() => Object.fromEntries(fields.map((field) => [field, initial?.[field] ?? ''])))
  const [imageFile, setImageFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const categoryResult = useAdminCollection(config.categoryLoader || emptyCategories, 'categories')
  const change = (field, value) => setForm((current) => ({ ...current, [field]: value }))
  const submit = async (event) => {
    event.preventDefault()
    try {
      setUploading(Boolean(imageFile))
      const image = imageFile ? (await uploadFile(imageFile)).secure_url : form.image
      await onSubmit({ ...form, image })
    } catch (error) {
      window.alert(error.message)
    } finally { setUploading(false) }
  }
  return <form className="admin-resource-form" onSubmit={submit}>
    {fields.map((field) => (
      <label key={field}>{fieldLabel(field)}
        {field === 'categoryId' && config.categoryLoader ? <select value={form[field]?._id || form[field]} onChange={(event) => change(field, event.target.value)} required><option value="">Chọn danh mục</option>{categoryResult.items.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}</select> :
          field === 'status' ? <select value={form[field]} onChange={(event) => change(field, event.target.value)}><option value="">Chọn trạng thái</option>{(config.statuses || []).map((value) => <option key={value} value={value}>{value}</option>)}</select> :
            field === 'image' ? <><input type="file" accept="image/*" onChange={(event) => setImageFile(event.target.files?.[0] || null)} />{form.image && <small>Ảnh hiện tại: {form.image}</small>}</> :
              <input type={['price', 'discount', 'stock', 'capacity'].includes(field) ? 'number' : field.toLowerCase().includes('date') ? 'date' : 'text'} value={form[field]} onChange={(event) => change(field, event.target.value)} required={['name', 'code', 'categoryId', 'price', 'capacity'].includes(field)} />}
      </label>
    ))}
    <div className="admin-action-row"><button type="submit" className="admin-btn" disabled={uploading || categoryResult.isLoading}>{uploading ? 'Đang tải ảnh...' : 'Lưu'}</button><button type="button" className="admin-btn" onClick={onCancel}>Hủy</button></div>
  </form>
}

export default function AdminResourcePanel({ config }) {
  const { items, setItems, isLoading, error, retry } = useAdminCollection(config.loader, config.key)
  const [editing, setEditing] = useState(null)
  const [message, setMessage] = useState('')
  const run = async (callback, id, payload) => {
    try {
      setMessage('')
      const result = await callback(id, payload)
      if (!id) setItems((current) => [result, ...current])
      else if (callback === config.remove) setItems((current) => current.filter((item) => item._id !== id))
      else setItems((current) => current.map((item) => item._id === id ? { ...item, ...result } : item))
      setEditing(null)
    } catch (requestError) { setMessage(requestError.message) }
  }
  if (isLoading) return <AdminPanelLoading label={`Đang tải ${config.title}...`} />
  if (error) return <AdminPanelError message={error} onRetry={retry} />
  return <>
    {message && <p className="admin-row-error">{message}</p>}
    {editing && <ResourceForm config={config} initial={editing === 'new' ? null : editing} onCancel={() => setEditing(null)} onSubmit={(payload) => run(editing === 'new' ? config.create : config.update, editing === 'new' ? null : editing._id, payload)} />}
    {config.create && config.fields?.length > 0 && <div className="admin-resource-toolbar"><button type="button" className="admin-btn" onClick={() => setEditing('new')}>Thêm {config.title}</button></div>}
    {items.length === 0 ? <AdminPanelEmpty message={`Chưa có ${config.title}.`} /> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr>{config.columns.map((column) => <th key={column[0]}>{column[1]}</th>)}<th>Hành động</th></tr></thead><tbody>{items.map((item) => <tr key={item._id}>{config.columns.map(([field]) => <td key={field}>{Array.isArray(item[field]) ? item[field].length : displayValue(item[field])}</td>)}<td><div className="admin-action-row">{config.update && config.fields?.length > 0 && <button type="button" className="admin-btn" onClick={() => setEditing(item)}>Sửa</button>}{config.restore && item.isDeleted && <button type="button" className="admin-btn" onClick={() => run(config.restore, item._id)}>Khôi phục</button>}{config.remove && <button type="button" className="admin-btn admin-btn--danger" onClick={() => window.confirm('Xác nhận xóa?') && run(config.remove, item._id)}>Xóa</button>}</div></td></tr>)}</tbody></table></div>}
  </>
}
