import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BrandMark } from '../components/AuthIcons.jsx'
import { useAuth } from '../hooks/useAuth.js'
import UsersPanel from '../components/admin/UsersPanel.jsx'
import OperationsPanel from '../components/admin/OperationsPanel.jsx'
import AdminResourcePanel from '../components/admin/AdminResourcePanel.jsx'
import { getCategories, createCategory, updateCategory, deleteCategory } from '../services/categoryService.js'
import { getDishes, createDish, updateDish, deleteDish, restoreDish } from '../services/dishService.js'
import { getMenus, createMenu, updateMenu, deleteMenu, restoreMenu } from '../services/menuService.js'
import { getTables, createTable, updateTable, deleteTable } from '../services/tableService.js'
import { getReservationTables, deleteReservationTable } from '../services/reservationTableService.js'

// Tab này là danh sách bàn đang được giữ, không phải lịch sử gán bàn.
// Loại luôn các bản ghi cũ bị mất liên kết tới bàn để tránh hiển thị "—".
const getActiveReservationTables = async (_query, signal) => {
  const result = await getReservationTables({ status: 'Active' }, signal)
  return {
    ...result,
    reservationTables: result.reservationTables.filter((item) => item.tableId),
  }
}

const resources = {
  categories: { title: 'danh mục', key: 'categories', loader: getCategories, create: createCategory, update: updateCategory, remove: deleteCategory, fields: ['name', 'description', 'status'], statuses: ['active', 'inactive'], columns: [['name', 'Tên'], ['description', 'Mô tả'], ['status', 'Trạng thái']] },
  dishes: { title: 'món ăn', key: 'dishes', loader: getDishes, categoryLoader: getCategories, create: createDish, update: updateDish, remove: deleteDish, restore: restoreDish, fields: ['categoryId', 'code', 'name', 'description', 'type', 'servingUnit', 'price', 'discount', 'stock', 'image', 'isFeatured'], columns: [['code', 'Mã'], ['name', 'Tên món'], ['price', 'Giá'], ['discount', 'Giảm giá'], ['isFeatured', 'Nổi bật'], ['status', 'Trạng thái']] },
  menus: { title: 'thực đơn', key: 'menus', loader: getMenus, create: createMenu, update: updateMenu, remove: deleteMenu, restore: restoreMenu, fields: ['name', 'description', 'image', 'status', 'startDate', 'endDate'], statuses: ['Active', 'Inactive'], columns: [['name', 'Tên'], ['status', 'Trạng thái'], ['items', 'Số món']] },
  tables: { title: 'bàn', key: 'tables', loader: getTables, create: createTable, update: updateTable, remove: deleteTable, fields: ['tableNumber', 'capacity', 'location', 'note', 'status'], statuses: ['Available', 'Occupied', 'Reserved', 'Cleaning'], columns: [['tableNumber', 'Số bàn'], ['capacity', 'Sức chứa'], ['location', 'Khu vực'], ['status', 'Trạng thái']] },
  'reservation-tables': { title: 'bàn đã gán', key: 'reservationTables', loader: getActiveReservationTables, remove: deleteReservationTable, columns: [['reservationId', 'Đặt bàn'], ['tableId', 'Bàn'], ['status', 'Trạng thái']] },
}

// Bốn nhóm theo công việc thật, thay cho tám tab ngang hàng. Nhóm nào có nhiều
// bảng dữ liệu thì chuyển qua lại bằng một dải chọn phụ bên trong.
const groups = [
  { id: 'operations', label: 'Vận hành', hint: 'Đặt bàn và hóa đơn đi liền một luồng' },
  { id: 'menu', label: 'Thực đơn', sections: [['dishes', 'Món ăn'], ['categories', 'Danh mục'], ['menus', 'Bộ thực đơn']] },
  { id: 'tables', label: 'Bàn', sections: [['tables', 'Danh sách bàn'], ['reservation-tables', 'Bàn đã gán']] },
  { id: 'users', label: 'Người dùng' },
]

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const { user, endSession } = useAuth()
  const [groupId, setGroupId] = useState('operations')
  const [sectionId, setSectionId] = useState('dishes')

  const logout = () => { endSession(); navigate('/login', { replace: true }) }
  const group = groups.find((entry) => entry.id === groupId)
  const sections = group?.sections || []
  const activeSection = sections.some(([id]) => id === sectionId) ? sectionId : sections[0]?.[0]

  const openGroup = (entry) => {
    setGroupId(entry.id)
    if (entry.sections) setSectionId(entry.sections[0][0])
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
          <p>Theo dõi và cập nhật dữ liệu vận hành nhà hàng.</p>
        </section>

        <div className="admin-tabs" role="tablist" aria-label="Nhóm quản trị">
          {groups.map((entry) => (
            <button key={entry.id} type="button" role="tab"
              aria-selected={groupId === entry.id}
              className={groupId === entry.id ? 'admin-tab is-active' : 'admin-tab'}
              onClick={() => openGroup(entry)}>
              {entry.label}
            </button>
          ))}
        </div>

        {sections.length > 0 && (
          <div className="admin-subtabs" role="tablist" aria-label={`Bảng trong nhóm ${group.label}`}>
            {sections.map(([id, label]) => (
              <button key={id} type="button" role="tab"
                aria-selected={activeSection === id}
                className={activeSection === id ? 'admin-subtab is-active' : 'admin-subtab'}
                onClick={() => setSectionId(id)}>
                {label}
              </button>
            ))}
          </div>
        )}

        {groupId === 'operations' && <OperationsPanel />}
        {groupId === 'users' && <UsersPanel currentUser={user} />}
        {resources[activeSection] && groupId !== 'operations' && groupId !== 'users' && (
          <AdminResourcePanel key={activeSection} config={resources[activeSection]} />
        )}
      </main>
    </div>
  )
}
