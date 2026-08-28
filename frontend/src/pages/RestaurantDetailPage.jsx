import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import DataSourceNotice from '../components/customer/DataSourceNotice.jsx'
import DishCard from '../components/customer/DishCard.jsx'
import DishGridState from '../components/customer/DishGridState.jsx'
import UiIcon from '../components/UiIcon.jsx'
import { DEFAULT_RESTAURANT, isDefaultRestaurant } from '../config/restaurant.js'
import { useDishes } from '../hooks/useDishes.js'
import {
  buildDishCategories,
  dishMatchesQuery,
  getDishCategoryKey,
  getDishId,
} from '../utils/booking.js'

const ALL_CATEGORIES = 'all'

function RestaurantDetailPage() {
  const { restaurantId } = useParams()
  const { dishes, isLoading, error, retry } = useDishes()
  const [query, setQuery] = useState('')
  const [categoryKey, setCategoryKey] = useState(ALL_CATEGORIES)

  const categories = useMemo(() => buildDishCategories(dishes), [dishes])
  const visibleDishes = useMemo(() => dishes.filter((dish) => (
    (categoryKey === ALL_CATEGORIES || getDishCategoryKey(dish) === categoryKey)
    && dishMatchesQuery(dish, query)
  )), [dishes, categoryKey, query])

  // Thực đơn tải lại mà danh mục đang lọc không còn món nào thì lưới trắng trơn
  // và cái nút để bấm quay ra cũng biến mất cùng nó — tự trả về "Tất cả".
  useEffect(() => {
    if (categoryKey !== ALL_CATEGORIES && !categories.some((item) => item.key === categoryKey)) {
      setCategoryKey(ALL_CATEGORIES)
    }
  }, [categories, categoryKey])

  if (!isDefaultRestaurant(restaurantId)) {
    return (
      <main className="customer-main">
        <div className="customer-empty-card">
          <span>404</span>
          <h1>Không tìm thấy nhà hàng</h1>
          <p>Nhà hàng này chưa có trong hệ thống hiện tại.</p>
          <Link className="customer-primary-link" to="/restaurants">Quay lại danh sách</Link>
        </div>
      </main>
    )
  }

  const hasDishes = !isLoading && !error && dishes.length > 0
  const clearFilters = () => {
    setQuery('')
    setCategoryKey(ALL_CATEGORIES)
  }

  return (
    <main>
      <section className="restaurant-detail-hero">
        <div className="restaurant-detail-hero__inner">
        <div>
          <Link className="back-link" to="/restaurants">
            <UiIcon name="arrow-left" />
            Tất cả nhà hàng
          </Link>
          <span className="customer-kicker">{DEFAULT_RESTAURANT.eyebrow}</span>
          <h1>{DEFAULT_RESTAURANT.name}</h1>
          <p>{DEFAULT_RESTAURANT.description}</p>
          <div className="restaurant-detail-hero__facts">
            <span><UiIcon name="clock" /> Giờ phục vụ: {DEFAULT_RESTAURANT.hours}</span>
            <span><UiIcon name="location" /> Địa chỉ: {DEFAULT_RESTAURANT.address}</span>
          </div>
        </div>
        <Link className="customer-primary-link" to={'/booking/' + DEFAULT_RESTAURANT.id}>
          Chọn thời gian và số khách
          <UiIcon name="arrow-right" />
        </Link>
        </div>
      </section>

      <div className="landing-notice-band">
        <div className="landing-notice-band__inner">
          <DataSourceNotice />
        </div>
      </div>

      <section className="menu-section customer-main" aria-labelledby="menu-heading">
        <div className="section-heading">
          <div>
            <span className="customer-kicker">Từ bếp Bàn Việt</span>
            <h2 id="menu-heading">Thực đơn hôm nay</h2>
          </div>
          <p>Bấm vào một món để xem mô tả chi tiết. Đặt bàn không bắt buộc chọn món trước.</p>
        </div>

        <DishGridState
          isLoading={isLoading}
          error={error}
          isEmpty={!isLoading && !error && dishes.length === 0}
          onRetry={retry}
        />

        {hasDishes && (
          <div className="menu-toolbar">
            <div className="menu-search">
              <UiIcon name="search" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm món theo tên, mô tả hoặc danh mục"
                aria-label="Tìm món ăn"
              />
              {query && (
                <button
                  type="button"
                  className="menu-search__clear"
                  onClick={() => setQuery('')}
                  aria-label="Xoá từ khoá tìm kiếm"
                >
                  <UiIcon name="close" />
                </button>
              )}
            </div>

            <div className="menu-categories" role="group" aria-label="Lọc theo danh mục">
              <button
                type="button"
                className={'menu-chip' + (categoryKey === ALL_CATEGORIES ? ' is-active' : '')}
                aria-pressed={categoryKey === ALL_CATEGORIES}
                onClick={() => setCategoryKey(ALL_CATEGORIES)}
              >
                Tất cả<span>{dishes.length}</span>
              </button>
              {categories.map((category) => (
                <button
                  key={category.key}
                  type="button"
                  className={'menu-chip' + (categoryKey === category.key ? ' is-active' : '')}
                  aria-pressed={categoryKey === category.key}
                  onClick={() => setCategoryKey(category.key)}
                >
                  {category.label}<span>{category.count}</span>
                </button>
              ))}
            </div>

            <p className="menu-toolbar__count" role="status">
              {visibleDishes.length === dishes.length
                ? `${dishes.length} món trong thực đơn`
                : `${visibleDishes.length}/${dishes.length} món khớp bộ lọc`}
            </p>
          </div>
        )}

        {hasDishes && visibleDishes.length === 0 && (
          <div className="menu-state">
            <strong>Không có món nào khớp</strong>
            <p>Thử một từ khoá khác, hoặc bỏ lọc danh mục để xem lại toàn bộ thực đơn.</p>
            <button type="button" className="outline-action" onClick={clearFilters}>
              Xoá bộ lọc
            </button>
          </div>
        )}

        {hasDishes && visibleDishes.length > 0 && (
          <div className="dish-grid">
            {visibleDishes.map((dish) => (
              <DishCard key={getDishId(dish)} dish={dish} showInventory />
            ))}
          </div>
        )}
      </section>

      <div className="sticky-booking-bar">
        <div>
          <strong>Sẵn sàng cho một bữa ăn thư thả?</strong>
          <span>Không bắt buộc chọn món · Mức cọc dự kiến 20%</span>
        </div>
        <Link className="customer-primary-link" to={'/booking/' + DEFAULT_RESTAURANT.id}>
          Bắt đầu đặt bàn
        </Link>
      </div>
    </main>
  )
}

export default RestaurantDetailPage
