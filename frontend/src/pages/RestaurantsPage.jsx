import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import DishCard from '../components/customer/DishCard.jsx'
import DishGridState from '../components/customer/DishGridState.jsx'
import { BrandMark } from '../components/AuthIcons.jsx'
import UiIcon from '../components/UiIcon.jsx'
import { DEFAULT_RESTAURANT } from '../config/restaurant.js'
import { useDishes } from '../hooks/useDishes.js'
import { API_BASE_URL } from '../services/apiClient.js'
import { useBookingDraft } from '../context/bookingDraftStore.js'
import { buildDishCategories, calculateBookingEstimate, formatCurrency, dishMatchesQuery, getDishCategoryKey, getDishId } from '../utils/booking.js'

const ALL_CATEGORIES = 'all'

function RestaurantsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { dishes, isLoading, error, retry } = useDishes()
  const { draft, reconcileItems } = useBookingDraft()
  const { dishTotal } = calculateBookingEstimate(draft)
  useEffect(() => {
    if (!isLoading && !error) reconcileItems(dishes)
  }, [dishes, isLoading, error, reconcileItems])
  const [query, setQuery] = useState('')
  const categoryKey = searchParams.get('category') || ALL_CATEGORIES
  const setCategoryKey = (value) => setSearchParams(value === ALL_CATEGORIES ? {} : { category: value }, { replace: true })
  const categories = useMemo(() => buildDishCategories(dishes), [dishes])
  const visibleDishes = useMemo(() => dishes.filter((dish) => (
    (categoryKey === ALL_CATEGORIES || getDishCategoryKey(dish) === categoryKey)
    && dishMatchesQuery(dish, query)
  )), [categoryKey, dishes, query])

  useEffect(() => {
    if (!isLoading && !error && categoryKey !== ALL_CATEGORIES && !categories.some((item) => item.key === categoryKey)) setSearchParams({}, { replace: true })
  }, [categories, categoryKey, isLoading, error, setSearchParams])

  return (
    <main className="restaurant-shop">
      <div className="restaurant-shop__crumbs">
        <Link to="/">Trang chủ</Link><span>&gt;</span><Link to="/restaurants">{DEFAULT_RESTAURANT.name}</Link>
      </div>
      <div className="restaurant-shop__layout">
        <aside className="restaurant-sidebar" aria-label="Danh mục món ăn">
          <div className="restaurant-sidebar__brand"><BrandMark /><strong>{DEFAULT_RESTAURANT.name}</strong></div>
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
          <p className="menu-photo-credit"><a href={`${API_BASE_URL}/media/credits.html`} target="_blank" rel="noreferrer">Ảnh minh họa · Nguồn ảnh</a></p>
          {!isLoading && !error && dishes.length > 0 && visibleDishes.length === 0 && <div className="menu-state"><strong>Không tìm thấy món phù hợp</strong><button type="button" className="outline-action" onClick={() => { setQuery(''); setCategoryKey(ALL_CATEGORIES) }}>Xóa bộ lọc</button></div>}
          {!isLoading && !error && visibleDishes.length > 0 && <div className="dish-grid">{visibleDishes.map((dish) => <DishCard key={getDishId(dish)} dish={dish} showInventory />)}</div>}
        </section>

        <aside className="restaurant-cart" aria-label="Giỏ đặt món">
          <div className="restaurant-cart__header"><h2>Chi tiết đặt món</h2><span>{draft.items.reduce((sum, item) => sum + item.quantity, 0)}</span></div>
          {draft.items.length ? <ul className="review-items">{draft.items.map((item) => <li key={item.dishId}><span>{item.quantity} × {item.name}</span><strong>{formatCurrency(item.price * item.quantity)}</strong></li>)}</ul> : <div className="restaurant-cart__empty"><strong>Hiện chưa có món</strong><p>Bấm Đặt bàn ngay để chọn thời gian và thêm món vào bản nháp.</p></div>}
          <div className="restaurant-cart__total"><span>Tạm tính:</span><strong>{formatCurrency(dishTotal)}</strong></div>
          <Link className="restaurant-cart__button" to={'/booking/' + DEFAULT_RESTAURANT.id}>Đặt bàn ngay</Link>
        </aside>
      </div>
    </main>
  )
}

export default RestaurantsPage
