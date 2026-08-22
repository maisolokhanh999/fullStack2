import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BrandMark } from '../components/AuthIcons.jsx'
import { useAuth } from '../hooks/useAuth.js'
import UsersPanel from '../components/admin/UsersPanel.jsx'
import ReservationsPanel from '../components/admin/ReservationsPanel.jsx'
import InvoicesPanel from '../components/admin/InvoicesPanel.jsx'
import AdminResourcePanel from '../components/admin/AdminResourcePanel.jsx'
import InvoiceDetailsPanel from '../components/admin/InvoiceDetailsPanel.jsx'
import { getCategories, createCategory, updateCategory, deleteCategory } from '../services/categoryService.js'
import { getDishes, createDish, updateDish, deleteDish, restoreDish } from '../services/dishService.js'
import { getMenus, createMenu, updateMenu, deleteMenu, restoreMenu } from '../services/menuService.js'
import { getTables, createTable, updateTable, deleteTable } from '../services/tableService.js'
import { getReservationTables, deleteReservationTable } from '../services/reservationTableService.js'

const tabs = [['users', 'Người dùng'], ['categories', 'Danh mục'], ['dishes', 'Món ăn'], ['menus', 'Thực đơn'], ['tables', 'Bàn'], ['reservations', 'Đặt bàn'], ['reservation-tables', 'Bàn đã gán'], ['invoices', 'Hóa đơn'], ['invoice-details', 'Chi tiết HĐ']]
const resources = {
  categories: { title: 'danh mục', key: 'categories', loader: getCategories, create: createCategory, update: updateCategory, remove: deleteCategory, fields: ['name', 'description', 'status'], statuses: ['active', 'inactive'], columns: [['name', 'Tên'], ['description', 'Mô tả'], ['status', 'Trạng thái']] },
  dishes: { title: 'món ăn', key: 'dishes', loader: getDishes, categoryLoader: getCategories, create: createDish, update: updateDish, remove: deleteDish, restore: restoreDish, fields: ['categoryId', 'code', 'name', 'type', 'servingUnit', 'price', 'discount', 'stock', 'image'], columns: [['code', 'Mã'], ['name', 'Tên món'], ['price', 'Giá'], ['status', 'Trạng thái']] },
  menus: { title: 'thực đơn', key: 'menus', loader: getMenus, create: createMenu, update: updateMenu, remove: deleteMenu, restore: restoreMenu, fields: ['name', 'description', 'image', 'status', 'startDate', 'endDate'], statuses: ['Active', 'Inactive'], columns: [['name', 'Tên'], ['status', 'Trạng thái'], ['items', 'Số món']] },
  tables: { title: 'bàn', key: 'tables', loader: getTables, create: createTable, update: updateTable, remove: deleteTable, fields: ['tableNumber', 'capacity', 'location', 'note', 'status'], statuses: ['Available', 'Occupied', 'Reserved', 'Cleaning'], columns: [['tableNumber', 'Số bàn'], ['capacity', 'Sức chứa'], ['location', 'Khu vực'], ['status', 'Trạng thái']] },
  'reservation-tables': { title: 'bàn đã gán', key: 'reservationTables', loader: getReservationTables, remove: deleteReservationTable, columns: [['reservationId', 'Đặt bàn'], ['tableId', 'Bàn'], ['status', 'Trạng thái']] },
}

export default function AdminDashboardPage() {
  const navigate = useNavigate(); const { user, endSession } = useAuth(); const [activeTab, setActiveTab] = useState('users')
  const logout = () => { endSession(); navigate('/login', { replace: true }) }
  return <div className="admin-app"><header className="staff-header"><div className="staff-header__inner"><Link className="site-brand" to="/restaurants" aria-label="Bàn Việt - Về trang nhà hàng"><BrandMark /><span>Bàn Việt</span></Link><span className="staff-portal-label">Cổng quản trị</span><nav><Link to="/restaurants">Trang nhà hàng</Link><Link to="/dashboard">{user?.name || 'Tài khoản'}</Link><button type="button" onClick={logout}>Đăng xuất</button></nav></div></header><main className="customer-main admin-page"><section className="admin-hero"><span className="customer-kicker">Bảng điều khiển</span><h1>Quản trị hệ thống</h1><p>Theo dõi và cập nhật dữ liệu vận hành nhà hàng.</p></section><div className="admin-tabs" role="tablist">{tabs.map(([id, label]) => <button key={id} type="button" role="tab" aria-selected={activeTab === id} className={activeTab === id ? 'admin-tab is-active' : 'admin-tab'} onClick={() => setActiveTab(id)}>{label}</button>)}</div>{activeTab === 'users' && <UsersPanel currentUser={user} />}{activeTab === 'reservations' && <ReservationsPanel />}{activeTab === 'invoices' && <InvoicesPanel />}{resources[activeTab] && <AdminResourcePanel config={resources[activeTab]} />}{activeTab === 'invoice-details' && <InvoiceDetailsPanel />}</main></div>
}
