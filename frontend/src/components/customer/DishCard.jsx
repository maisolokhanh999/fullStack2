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
          {/* Chỉ ngôi sao, không kèm chữ "Nổi bật ·": thẻ hẹp thì hai chữ đó ăn hết
              chỗ và tên nhóm món bị cắt cụt thành "Mó…". Trang chi tiết rộng rãi
              nên vẫn ghi đủ chữ. */}
          <span className="dish-card__category" title={dish.isFeatured ? 'Món nổi bật' : undefined}>
            {dish.isFeatured && <UiIcon name="star" />}
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
          {/* Thẻ hẹp nên chỉ để số còn lại — đơn vị đã nằm sẵn trong chính câu đó,
              thêm "Đơn vị: Phần ·" nữa là lặp chữ và vắt dòng. Trang chi tiết mới
              tách riêng hai ô đơn vị và tồn kho. */}
          {showInventory && stock !== null && (
            <span className="dish-card__inventory">
              Còn {stock}{servingUnit ? ` ${servingUnit.toLowerCase()}` : ''}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

export default DishCard
