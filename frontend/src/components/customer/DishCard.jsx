import { Link } from 'react-router-dom'
import DishVisual from './DishVisual.jsx'
import UiIcon from '../UiIcon.jsx'
import {
  formatCurrency,
  getDishCategoryLabel,
  getDishDetailPath,
  getDishPrice,
  getDishServingUnit,
  getDishStock,
  isDishAvailable,
} from '../../utils/booking.js'

// Cả thẻ là một liên kết sang trang chi tiết món. Dùng thẳng <Link> thay vì
// <article> bọc một link con để bấm vào chỗ nào trên thẻ cũng mở được, và bàn
// phím chỉ dừng một lần cho mỗi món thay vì hai.
function DishCard({ dish, showInventory = false }) {
  const available = isDishAvailable(dish)
  const price = getDishPrice(dish)
  const servingUnit = getDishServingUnit(dish)
  const stock = getDishStock(dish)

  return (
    <Link
      className={'dish-card' + (available ? '' : ' dish-card--unavailable')}
      to={getDishDetailPath(dish)}
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

        {/* Món chưa có mô tả thì để trống hẳn, không chèn câu giữ chỗ. Thẻ <p>
            vẫn giữ nguyên chiều cao tối thiểu nên lưới không so le. */}
        <h3>{dish.name}</h3>
        <p>{dish.description}</p>

        <div className="dish-card__footer">
          <div className="dish-card__price">
            <strong>{formatCurrency(price)}</strong>
            {Number(dish.discount) > 0 && Number(dish.price) !== price && (
              <del>{formatCurrency(dish.price)}</del>
            )}
          </div>
          {showInventory && (servingUnit || stock !== null) && (
            <span className="dish-card__inventory">
              {servingUnit && `Đơn vị: ${servingUnit}`}
              {servingUnit && stock !== null && ' · '}
              {stock !== null && `Còn ${stock}${servingUnit ? ` ${servingUnit.toLowerCase()}` : ''}`}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

export default DishCard
