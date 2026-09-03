import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import DishCard from '../components/customer/DishCard.jsx'
import DishGridState from '../components/customer/DishGridState.jsx'
import UiIcon from '../components/UiIcon.jsx'
import { DEFAULT_RESTAURANT } from '../config/restaurant.js'
import { useDishes } from '../hooks/useDishes.js'
import { buildDishCategories, dishMatchesQuery, getDishCategoryKey, getDishId } from '../utils/booking.js'

const ALL_CATEGORIES = 'all'

function RestaurantsPage() {
  const { dishes, isLoading, error, retry } = useDishes()
  const [query, setQuery] = useState('')
  const [categoryKey, setCategoryKey] = useState(ALL_CATEGORIES)
  const categories = useMemo(() => buildDishCategories(dishes), [dishes])
  const visibleDishes = useMemo(() => dishes.filter((dish) => (
    (categoryKey === ALL_CATEGORIES || getDishCategoryKey(dish) === categoryKey)
    && dishMatchesQuery(dish, query)
  )), [categoryKey, dishes, query])

  useEffect(() => {
    if (categoryKey !== ALL_CATEGORIES && !categories.some((item) => item.key === categoryKey)) setCategoryKey(ALL_CATEGORIES)
  }, [categories, categoryKey])

  return (
    <main className="restaurant-shop">
      <div className="restaurant-shop__crumbs">
        <Link to="/">Trang chủ</Link><span>&gt;</span><Link to="/restaurants">{DEFAULT_RESTAURANT.name}</Link>
      </div>
      <div className="restaurant-shop__layout">
        <aside className="restaurant-sidebar" aria-label="Danh mục món ăn">
          <div className="restaurant-sidebar__brand"><span>BV</span><strong>{DEFAULT_RESTAURANT.name}</strong></div>
          <p className="restaurant-sidebar__title">Danh mục thực đơn</p>
          <button type="button" className={categoryKey === ALL_CATEGORIES ? 'is-active' : ''} onClick={() => setCategoryKey(ALL_CATEGORIES)}>Tất cả món <span>{dishes.length}</span></button>
          {categories.map((category) => <button key={category.key} type="button" className={categoryKey === category.key ? 'is-active' : ''} onClick={() => setCategoryKey(category.key)}>{category.label} <span>{category.count}</span></button>)}
        </aside>

        <section className="restaurant-shop__products" aria-labelledby="menu-heading">
          <div className="restaurant-shop__toolbar">
            <div className="restaurant-shop__search">
              <UiIcon name="search" />
              <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm kiếm món ăn..." aria-label="Tìm kiếm món ăn" />
              {query && <button type="button" onClick={() => setQuery('')} aria-label="Xóa tìm kiếm"><UiIcon name="close" /></button>}
            </div>
            <span className="restaurant-shop__view" aria-hidden="true"><UiIcon name="grid" /></span>
          </div>
          <div className="restaurant-shop__heading"><span>{DEFAULT_RESTAURANT.name}</span><h1 id="menu-heading">Thực đơn hôm nay</h1><p role="status">{visibleDishes.length} món đang hiển thị</p></div>
          <DishGridState isLoading={isLoading} error={error} isEmpty={!isLoading && !error && dishes.length === 0} onRetry={retry} />
          {!isLoading && !error && visibleDishes.length === 0 && <div className="menu-state"><strong>Không tìm thấy món phù hợp</strong><button type="button" className="outline-action" onClick={() => { setQuery(''); setCategoryKey(ALL_CATEGORIES) }}>Xóa bộ lọc</button></div>}
          {!isLoading && !error && visibleDishes.length > 0 && <div className="dish-grid">{visibleDishes.map((dish) => <DishCard key={getDishId(dish)} dish={dish} showInventory />)}</div>}
        </section>

        <aside className="restaurant-cart" aria-label="Giỏ đặt món">
          <div className="restaurant-cart__header"><h2>Chi tiết đặt món</h2><span>0</span></div>
          <div className="restaurant-cart__empty"><strong>Hiện chưa có món</strong><p>Chọn món trong thực đơn để xem ở đây.</p></div>
          <div className="restaurant-cart__total"><span>Tạm tính:</span><strong>0 đ</strong></div>
          <Link className="restaurant-cart__button" to={'/booking/' + DEFAULT_RESTAURANT.id}>Đặt bàn ngay</Link>
        </aside>
      </div>
    </main>
  )
}

export default RestaurantsPage
