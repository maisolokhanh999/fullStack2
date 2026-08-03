import { Link, useParams } from 'react-router-dom'
import DataSourceNotice from '../components/customer/DataSourceNotice.jsx'
import DishGridState from '../components/customer/DishGridState.jsx'
import DishVisual from '../components/customer/DishVisual.jsx'
import { DEFAULT_RESTAURANT, isDefaultRestaurant } from '../config/restaurant.js'
import { useDishes } from '../hooks/useDishes.js'
import {
  formatCurrency,
  getDishCategoryLabel,
  getDishId,
  getDishPrice,
  getDishServingUnit,
  getDishStock,
  isDishAvailable,
} from '../utils/booking.js'

function RestaurantDetailPage() {
  const { restaurantId } = useParams()
  const { dishes, isLoading, error, retry } = useDishes()

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

  return (
    <main className="customer-main">
      <section className="restaurant-detail-hero">
        <div>
          <Link className="back-link" to="/restaurants">← Tất cả nhà hàng</Link>
          <span className="customer-kicker">{DEFAULT_RESTAURANT.eyebrow}</span>
          <h1>{DEFAULT_RESTAURANT.name}</h1>
          <p>{DEFAULT_RESTAURANT.description}</p>
          <div className="restaurant-detail-hero__facts">
            <span>◷ {DEFAULT_RESTAURANT.hours}</span>
            <span>⌖ {DEFAULT_RESTAURANT.address}</span>
          </div>
        </div>
        <Link className="customer-primary-link" to={'/booking/' + DEFAULT_RESTAURANT.id}>
          Chọn thời gian & số khách
          <span aria-hidden="true">→</span>
        </Link>
      </section>

      <DataSourceNotice />

      <section className="menu-section" aria-labelledby="menu-heading">
        <div className="section-heading">
          <div>
            <span className="customer-kicker">Từ bếp Bàn Việt</span>
            <h2 id="menu-heading">Thực đơn hôm nay</h2>
          </div>
          <p>Bạn có thể đặt bàn trước mà không cần chọn món.</p>
        </div>

        <DishGridState
          isLoading={isLoading}
          error={error}
          isEmpty={!isLoading && !error && dishes.length === 0}
          onRetry={retry}
        />

        {!isLoading && !error && dishes.length > 0 && (
          <div className="dish-grid">
            {dishes.map((dish) => {
              const available = isDishAvailable(dish)
              const price = getDishPrice(dish)
              const categoryName = getDishCategoryLabel(dish)
              const servingUnit = getDishServingUnit(dish)
              const stock = getDishStock(dish)

              return (
                <article className={'dish-card' + (!available ? ' dish-card--unavailable' : '')} key={getDishId(dish)}>
                  <DishVisual dish={dish} />
                  <div className="dish-card__body">
                    <div className="dish-card__topline">
                      <span>{dish.isFeatured ? `★ Nổi bật · ${categoryName}` : categoryName}</span>
                      <span className={'dish-status dish-status--' + (available ? 'available' : 'unavailable')}>
                        {available ? 'Có thể đặt trước' : 'Tạm hết'}
                      </span>
                    </div>
                    <h3>{dish.name}</h3>
                    <p>{dish.description || 'Mô tả món ăn đang được cập nhật.'}</p>
                    <div className="dish-card__footer">
                      <div className="dish-card__price">
                        <strong>{formatCurrency(price)}</strong>
                        {Number(dish.discount) > 0 && Number(dish.price) !== price && (
                          <del>{formatCurrency(dish.price)}</del>
                        )}
                      </div>
                      {(servingUnit || stock !== null) && (
                        <span className="dish-card__inventory">
                          {servingUnit && `Theo ${servingUnit.toLowerCase()}`}
                          {servingUnit && stock !== null && ' · '}
                          {stock !== null && `Còn ${stock}`}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <div className="sticky-booking-bar">
        <div>
          <strong>Sẵn sàng cho một bữa ăn thư thả?</strong>
          <span>Chọn món là tùy chọn · Cọc dự kiến 20%</span>
        </div>
        <Link className="customer-primary-link" to={'/booking/' + DEFAULT_RESTAURANT.id}>
          Bắt đầu đặt bàn
        </Link>
      </div>
    </main>
  )
}

export default RestaurantDetailPage
