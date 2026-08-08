import { Link } from 'react-router-dom'
import DataSourceNotice from '../components/customer/DataSourceNotice.jsx'
import UiIcon from '../components/UiIcon.jsx'
import { DEFAULT_RESTAURANT } from '../config/restaurant.js'

function RestaurantsPage() {
  return (
    <main className="customer-main">
      <section className="customer-hero">
        <div className="customer-hero__copy">
          <span className="customer-kicker">Đặt trước · Đến là thưởng thức</span>
          <h1>Bữa ăn trọn vẹn bắt đầu từ một chỗ ngồi được chuẩn bị kỹ.</h1>
          <p>
            Chọn thời gian, đặt cọc để giữ bàn và chọn món trước nếu muốn.
            Khi đến nơi, bạn chỉ cần xác nhận với nhân viên để bắt đầu dùng bữa.
          </p>
        </div>
        <div className="hero-plate" aria-hidden="true">
          <span className="hero-plate__leaf hero-plate__leaf--one" />
          <span className="hero-plate__leaf hero-plate__leaf--two" />
          <span className="hero-plate__dish">B</span>
        </div>
      </section>

      <DataSourceNotice />

      <section className="restaurant-section" aria-labelledby="restaurant-heading">
        <div className="section-heading">
          <div>
            <span className="customer-kicker">Điểm đến hiện có</span>
            <h2 id="restaurant-heading">Chọn nhà hàng</h2>
          </div>
          <p>Danh sách chi nhánh đang được cập nhật. Hiện tại, bạn có thể đặt bàn tại Bàn Việt.</p>
        </div>

        <article className="restaurant-card">
          <div className="restaurant-card__art" aria-hidden="true">
            <span>BV</span>
          </div>
          <div className="restaurant-card__body">
            <div>
              <span className="availability-pill"><i /> Đang hiển thị thực đơn</span>
              <h3>{DEFAULT_RESTAURANT.name}</h3>
              <p>{DEFAULT_RESTAURANT.description}</p>
            </div>
            <dl className="restaurant-meta">
              <div>
                <dt>Giờ phục vụ</dt>
                <dd>{DEFAULT_RESTAURANT.hours}</dd>
              </div>
              <div>
                <dt>Mức cọc dự kiến</dt>
                <dd>{DEFAULT_RESTAURANT.depositRate * 100}%</dd>
              </div>
            </dl>
            <div className="restaurant-card__actions">
              <Link className="customer-primary-link" to={'/restaurants/' + DEFAULT_RESTAURANT.id}>
                Xem thực đơn
                <UiIcon name="arrow-right" />
              </Link>
              <Link className="customer-secondary-link" to={'/booking/' + DEFAULT_RESTAURANT.id}>
                Đặt bàn ngay
              </Link>
            </div>
          </div>
        </article>
      </section>
    </main>
  )
}

export default RestaurantsPage
