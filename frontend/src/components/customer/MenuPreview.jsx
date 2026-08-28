import { Link } from 'react-router-dom'
import DishCard from './DishCard.jsx'
import UiIcon from '../UiIcon.jsx'
import { DEFAULT_RESTAURANT } from '../../config/restaurant.js'
import { useDishes } from '../../hooks/useDishes.js'
import { getDishId, isDishAvailable } from '../../utils/booking.js'

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
          Bấm vào một món để xem mô tả chi tiết. Bạn có thể đặt bàn trước mà không cần
          chọn món.
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
            {preview.map((dish) => (
              <DishCard key={getDishId(dish)} dish={dish} />
            ))}
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
