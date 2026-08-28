import { Link, useParams } from 'react-router-dom'
import DishVisual from '../components/customer/DishVisual.jsx'
import UiIcon from '../components/UiIcon.jsx'
import { DEFAULT_RESTAURANT, isDefaultRestaurant } from '../config/restaurant.js'
import { useDish } from '../hooks/useDishes.js'
import {
  formatCurrency,
  getDishCategoryLabel,
  getDishPrice,
  getDishServingUnit,
  getDishStock,
  isDishAvailable,
} from '../utils/booking.js'

function NotFoundCard({ menuPath, title, message }) {
  return (
    <div className="customer-empty-card">
      <span>404</span>
      <h1>{title}</h1>
      <p>{message}</p>
      <Link className="customer-primary-link" to={menuPath}>Quay lại thực đơn</Link>
    </div>
  )
}

function DishDetailPage() {
  const { restaurantId, dishId } = useParams()
  const { dish, isLoading, error, isMissing, retry } = useDish(dishId)
  const menuPath = `/restaurants/${DEFAULT_RESTAURANT.id}`

  if (!isDefaultRestaurant(restaurantId)) {
    return (
      <main className="customer-main">
        <NotFoundCard
          menuPath={menuPath}
          title="Không tìm thấy nhà hàng"
          message="Nhà hàng này chưa có trong hệ thống hiện tại."
        />
      </main>
    )
  }

  const available = dish ? isDishAvailable(dish) : false
  const price = dish ? getDishPrice(dish) : 0
  const servingUnit = dish ? getDishServingUnit(dish) : ''
  const stock = dish ? getDishStock(dish) : null
  const discount = Math.min(100, Math.max(0, Number(dish?.discount) || 0))
  const hasDiscount = discount > 0 && Number(dish?.price) !== price

  return (
    <main className="customer-main dish-detail-page">
      <Link className="back-link" to={menuPath}>
        <UiIcon name="arrow-left" />
        Về thực đơn
      </Link>

      {isLoading && (
        <div className="menu-state" role="status">
          <span className="spinner" aria-hidden="true" />
          <p>Đang tải thông tin món ăn...</p>
        </div>
      )}

      {!isLoading && error && (
        <div className="menu-state menu-state--error" role="alert">
          <strong>Chưa tải được món ăn</strong>
          <p>{error}</p>
          <button type="button" className="outline-action" onClick={retry}>Thử lại</button>
        </div>
      )}

      {!isLoading && !error && isMissing && (
        <NotFoundCard
          menuPath={menuPath}
          title="Không tìm thấy món ăn"
          message="Món này không còn trong thực đơn hoặc đã được gỡ khỏi hệ thống."
        />
      )}

      {!isLoading && !error && dish && (
        <article className="dish-detail">
          <div className="dish-detail__media">
            <DishVisual dish={dish} />
          </div>

          <div className="dish-detail__body">
            <div className="dish-detail__topline">
              <span className="dish-card__category">
                {dish.isFeatured && <UiIcon name="star" />}
                {dish.isFeatured && <span>Nổi bật ·</span>}
                {getDishCategoryLabel(dish)}
              </span>
              <span className={'dish-status dish-status--' + (available ? 'available' : 'unavailable')}>
                {available ? 'Có thể đặt trước' : 'Tạm hết'}
              </span>
            </div>

            <h1>{dish.name}</h1>

            <div className="dish-detail__price">
              <strong>{formatCurrency(price)}</strong>
              {hasDiscount && <del>{formatCurrency(dish.price)}</del>}
              {hasDiscount && <span className="dish-detail__discount">−{discount}%</span>}
            </div>

            {/* Không có mô tả thì không hiện gì cả, thay vì một câu giữ chỗ. */}
            {dish.description && <p className="dish-detail__description">{dish.description}</p>}

            <dl className="dish-detail__facts">
              <div>
                <dt>Đơn vị</dt>
                <dd>{servingUnit || '—'}</dd>
              </div>
              <div>
                <dt>Còn lại</dt>
                <dd>
                  {stock === null
                    ? '—'
                    : `${stock}${servingUnit ? ` ${servingUnit.toLowerCase()}` : ''}`}
                </dd>
              </div>
              <div>
                <dt>Mã món</dt>
                <dd>{dish.code || '—'}</dd>
              </div>
            </dl>

            <div className="dish-detail__actions">
              <Link className="customer-primary-link" to={'/booking/' + DEFAULT_RESTAURANT.id}>
                Đặt bàn và chọn món
                <UiIcon name="arrow-right" />
              </Link>
              <Link className="customer-secondary-link" to={menuPath}>Xem món khác</Link>
            </div>
          </div>
        </article>
      )}
    </main>
  )
}

export default DishDetailPage
