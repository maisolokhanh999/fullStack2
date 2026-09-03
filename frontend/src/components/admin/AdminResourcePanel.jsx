import { useEffect, useState } from 'react'
import useAdminCollection from './useAdminCollection.js'
import { AdminPanelEmpty, AdminPanelError, AdminPanelLoading } from './AdminShared.jsx'
import { uploadFile } from '../../services/uploadService.js'
import { getDishes } from '../../services/dishService.js'
import { getMenuById, addDishToMenu, removeDishFromMenu } from '../../services/menuService.js'

const emptyCategories = async () => ({ categories: [] })

const fieldLabel = (field) => ({
  categoryId: 'Danh mục', tableNumber: 'Số bàn', servingUnit: 'Đơn vị',
  startDate: 'Ngày bắt đầu', endDate: 'Ngày kết thúc',
  name: 'Tên', code: 'Mã', type: 'Loại', description: 'Mô tả',
  price: 'Giá', discount: 'Giảm giá (%)', stock: 'Tồn kho', image: 'Ảnh',
  status: 'Trạng thái', capacity: 'Sức chứa', location: 'Khu vực', note: 'Ghi chú', isFeatured: 'Món nổi bật',
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
  const [formError, setFormError] = useState('')
  const categoryResult = useAdminCollection(config.categoryLoader || emptyCategories, 'categories')
  const change = (field, value) => setForm((current) => ({ ...current, [field]: value }))
  const submit = async (event) => {
    event.preventDefault()
    const requiredField = fields.find((field) => ['name', 'code', 'categoryId', 'price', 'capacity'].includes(field) && String(form[field] ?? '').trim() === '')
    if (requiredField) {
      setFormError(`${fieldLabel(requiredField)} không được để trống.`)
      return
    }
    for (const field of ['price', 'discount', 'stock', 'capacity']) {
      if (fields.includes(field) && (!Number.isFinite(Number(form[field])) || Number(form[field]) < 0)) {
        setFormError(`${fieldLabel(field)} phải là số không âm.`)
        return
      }
    }
    if (fields.includes('discount') && Number(form.discount) > 100) {
      setFormError('Giảm giá phải nằm trong khoảng 0 đến 100%.')
      return
    }
    if (fields.includes('startDate') && fields.includes('endDate') && form.startDate && form.endDate && form.startDate > form.endDate) {
      setFormError('Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.')
      return
    }
    try {
      setFormError('')
      setUploading(Boolean(imageFile))
      const image = imageFile ? (await uploadFile(imageFile)).secure_url : form.image
      await onSubmit({ ...form, image })
    } catch (error) {
      setFormError(error.message || 'Không thể lưu dữ liệu.')
    } finally { setUploading(false) }
  }
  return <form className="admin-resource-form" onSubmit={submit}>
    {formError && <p className="admin-row-error" role="alert">{formError}</p>}
    {categoryResult.error && <p className="admin-row-error" role="alert">Không tải được danh mục: {categoryResult.error}</p>}
    {fields.map((field) => (
      <label key={field}>{fieldLabel(field)}
        {field === 'isFeatured' ? <span className="admin-checkbox"><input type="checkbox" checked={Boolean(form[field])} onChange={(event) => change(field, event.target.checked)} /> Hiển thị ở mục nổi bật</span> :
        field === 'categoryId' && config.categoryLoader ? <select value={form[field]?._id || form[field]} onChange={(event) => change(field, event.target.value)} required><option value="">Chọn danh mục</option>{categoryResult.items.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}</select> :
          field === 'status' ? <select value={form[field]} onChange={(event) => change(field, event.target.value)}><option value="">Chọn trạng thái</option>{(config.statuses || []).map((value) => <option key={value} value={value}>{value}</option>)}</select> :
            field === 'type' ? <select value={form[field]} onChange={(event) => change(field, event.target.value)} required><option value="">Chọn loại</option>{['MainCourse', 'SideDish', 'Drink', 'Dessert'].map((value) => <option key={value} value={value}>{value}</option>)}</select> :
              field === 'servingUnit' ? <select value={form[field]} onChange={(event) => change(field, event.target.value)} required><option value="">Chọn đơn vị</option>{['Phần', 'Suất', 'Đĩa', 'Tô', 'Bát', 'Ly', 'Cốc', 'Chai', 'Lon', 'Miếng', 'Cái'].map((value) => <option key={value} value={value}>{value}</option>)}</select> :
              field === 'image' ? <><input type="file" accept="image/*" onChange={(event) => setImageFile(event.target.files?.[0] || null)} />{form.image && <small>Ảnh hiện tại: {form.image}</small>}</> :
              /* Mô tả và ghi chú dài tới 500 ký tự — nhét vào input một dòng thì
                 người nhập không đọc lại được thứ mình vừa gõ. */
              ['description', 'note'].includes(field) ? <textarea rows={3} maxLength={500} value={form[field]} onChange={(event) => change(field, event.target.value)} /> :
              <input type={['price', 'discount', 'stock', 'capacity'].includes(field) ? 'number' : field.toLowerCase().includes('date') ? 'date' : 'text'} min={['price', 'discount', 'stock', 'capacity'].includes(field) ? 0 : undefined} max={field === 'discount' ? 100 : undefined} value={form[field]} onChange={(event) => change(field, event.target.value)} required={['name', 'code', 'categoryId', 'price', 'capacity'].includes(field)} />}
      </label>
    ))}
    <div className="admin-action-row"><button type="submit" className="admin-btn" disabled={uploading || categoryResult.isLoading}>{uploading ? 'Đang tải ảnh...' : 'Lưu'}</button><button type="button" className="admin-btn" onClick={onCancel}>Hủy</button></div>
  </form>
}

function MenuItemsEditor({ menu, onClose, onChanged }) {
  const [dishes, setDishes] = useState([])
  const [current, setCurrent] = useState(menu)
  const [dishId, setDishId] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getDishes({ status: 'Available' }), getMenuById(menu._id)])
      .then(([dishResult, menuResult]) => { setDishes(dishResult.dishes); setCurrent(menuResult) })
      .catch((requestError) => setError(requestError.message))
  }, [menu._id])

  const changeItems = async (action) => {
    try {
      setError('')
      const updated = await action()
      setCurrent(updated)
      onChanged(updated)
    } catch (requestError) { setError(requestError.message) }
  }
  const used = new Set((current.items || []).map((item) => String(item.dishId?._id || item.dishId)))
  return <section className="admin-resource-form"><h3>Món trong thực đơn: {current.name}</h3>{error && <p className="admin-row-error">{error}</p>}<div className="admin-action-row"><select value={dishId} onChange={(event) => setDishId(event.target.value)}><option value="">Chọn món để thêm</option>{dishes.filter((dish) => !used.has(String(dish._id))).map((dish) => <option key={dish._id} value={dish._id}>{dish.name}</option>)}</select><button type="button" className="admin-btn" disabled={!dishId} onClick={() => changeItems(() => addDishToMenu(current._id, dishId))}>Thêm món</button><button type="button" className="admin-btn" onClick={onClose}>Đóng</button></div><ul>{(current.items || []).map((item) => <li key={item.dishId?._id || item.dishId}>{item.dishId?.name || item.dishId} <button type="button" className="admin-btn admin-btn--danger" onClick={() => changeItems(() => removeDishFromMenu(current._id, item.dishId?._id || item.dishId))}>Bỏ</button></li>)}</ul></section>
}

export default function AdminResourcePanel({ config }) {
  const { items, setItems, isLoading, error, retry } = useAdminCollection(config.loader, config.key)
  const [editing, setEditing] = useState(null)
  const [message, setMessage] = useState('')
  const [menuEditing, setMenuEditing] = useState(null)
  const run = async (callback, id, payload) => {
    try {
      setMessage('')
      // create* nhận (payload, signal) còn update*/delete* nhận (id, payload, signal).
      // Gọi chung một kiểu thì lúc tạo mới, payload rơi vào ô signal và fetch ném
      // TypeError — biểu hiện ra ngoài thành "Không kết nối được máy chủ".
      const result = id === null ? await callback(payload) : await callback(id, payload)
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
    {menuEditing && <MenuItemsEditor menu={menuEditing} onClose={() => setMenuEditing(null)} onChanged={(updated) => setItems((current) => current.map((item) => item._id === updated._id ? updated : item))} />}
    {config.create && config.fields?.length > 0 && <div className="admin-resource-toolbar"><button type="button" className="admin-btn" onClick={() => setEditing('new')}>Thêm {config.title}</button></div>}
    {config.key === 'menus' && items.length > 0 && <div className="admin-resource-toolbar"><label>Chọn thực đơn <select defaultValue="" onChange={(event) => setMenuEditing(items.find((item) => item._id === event.target.value) || null)}><option value="">Quản lý món trong thực đơn</option>{items.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select></label></div>}
    {items.length === 0 ? <AdminPanelEmpty message={`Chưa có ${config.title}.`} /> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr>{config.columns.map((column) => <th key={column[0]}>{column[1]}</th>)}<th>Hành động</th></tr></thead><tbody>{items.map((item) => <tr key={item._id}>{config.columns.map(([field]) => <td key={field}>{Array.isArray(item[field]) ? item[field].length : displayValue(item[field])}</td>)}<td><div className="admin-action-row">{config.update && config.fields?.length > 0 && <button type="button" className="admin-btn" onClick={() => setEditing(item)}>Sửa</button>}{config.restore && item.isDeleted && <button type="button" className="admin-btn" onClick={() => run(config.restore, item._id)}>Khôi phục</button>}{config.remove && <button type="button" className="admin-btn admin-btn--danger" onClick={() => window.confirm('Xác nhận xóa?') && run(config.remove, item._id)}>Xóa</button>}</div></td></tr>)}</tbody></table></div>}
  </>
}
