import { Link } from 'react-router-dom'
import DishVisual from './DishVisual.jsx'
import UiIcon from '../UiIcon.jsx'
import { DEFAULT_RESTAURANT } from '../../config/restaurant.js'
import { useDishes } from '../../hooks/useDishes.js'
import {
  formatCurrency,
  getDishCategoryLabel,
  getDishId,
  getDishPrice,
  isDishAvailable,
} from '../../utils/booking.js'

const PREVIEW_LIMIT = 6

// Món nổi bật lên trước, còn hàng lên trước, phần còn lại giữ nguyên thứ tự
// backend trả về (mới nhất trước).
const previewOrder = (dishes) => [...dishes].sort((a, b) => (
  Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured))
  || Number(isDishAvailable(b)) - Number(isDishAvailable(a))
)).slice(0, PREVIEW_LIMIT)

function MenuPreview() {
  const { dishes, isLoading, error, retry } = useDishes()
  const preview = previewOrder(dishes)
  const menuPath = `/restaurants/${DEFAULT_RESTAURANT.id}`

  return (
    <section className="landing-section" aria-labelledby="menu-preview-heading">
      <div className="landing-section__head">
        <div>
          <span className="landing-eyebrow landing-eyebrow--dark">Từ bếp Bàn Việt</span>
          <h2 id="menu-preview-heading">Thực đơn hôm nay</h2>
        </div>
        <p>
          Bạn có thể đặt bàn trước mà không cần chọn món. Muốn chọn sẵn thì chọn ngay
          trong lúc đặt.
        </p>
      </div>

      {isLoading && (
        <div className="menu-state" role="status">
          <span className="spinner" aria-hidden="true" />
          <p>Đang tải thực đơn từ nhà hàng...</p>
        </div>
      )}

      {!isLoading && error && (
        <div className="menu-state menu-state--error" role="alert">
          <strong>Chưa tải được thực đơn</strong>
          <p>{error}</p>
          <button type="button" className="outline-action" onClick={retry}>Thử lại</button>
        </div>
      )}

      {!isLoading && !error && preview.length === 0 && (
        <div className="menu-state">
          <strong>Thực đơn đang được cập nhật</strong>
          <p>Nhà hàng chưa có món nào để hiển thị. Bạn vẫn đặt bàn trước được.</p>
        </div>
      )}

      {!isLoading && !error && preview.length > 0 && (
        <>
          <div className="dish-grid">
            {preview.map((dish) => {
              const available = isDishAvailable(dish)
              const price = getDishPrice(dish)

              return (
                <article
                  className={'dish-card' + (available ? '' : ' dish-card--unavailable')}
                  key={getDishId(dish)}
                >
                  <DishVisual dish={dish} />
                  <div className="dish-card__body">
                    <div className="dish-card__topline">
                      <span className="dish-card__category">
                        {dish.isFeatured && <UiIcon name="star" />}
                        {dish.isFeatured && <span>Nổi bật ·</span>}
                        {getDishCategoryLabel(dish)}
                      </span>
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
                    </div>
                  </div>
                </article>
              )
            })}
          </div>

          <div className="landing-section__more">
            {/* Chỉ mời xem tiếp khi thật sự còn món chưa hiện ở trên */}
            {dishes.length > preview.length ? (
              <Link className="landing-link landing-link--quiet" to={menuPath}>
                Xem toàn bộ {dishes.length} món
                <UiIcon name="arrow-right" />
              </Link>
            ) : (
              <Link className="landing-link landing-link--quiet" to={menuPath}>
                Xem chi tiết nhà hàng
                <UiIcon name="arrow-right" />
              </Link>
            )}
          </div>
        </>
      )}
    </section>
  )
}

export default MenuPreview
