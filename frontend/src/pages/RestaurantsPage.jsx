import { Link } from 'react-router-dom'
import DataSourceNotice from '../components/customer/DataSourceNotice.jsx'
import LandingHero from '../components/customer/LandingHero.jsx'
import MenuPreview from '../components/customer/MenuPreview.jsx'
import UiIcon from '../components/UiIcon.jsx'
import { DEFAULT_RESTAURANT } from '../config/restaurant.js'

function RestaurantsPage() {
  return (
    <main className="landing">
      <LandingHero />

      <div className="landing-notice-band">
        <div className="landing-notice-band__inner">
          <DataSourceNotice />
        </div>
      </div>

      <div className="customer-main">
        <MenuPreview />

        <section className="landing-section" aria-labelledby="restaurant-heading">
          <div className="landing-section__head">
            <div>
              <span className="landing-eyebrow landing-eyebrow--dark">Điểm đến hiện có</span>
              <h2 id="restaurant-heading">Chọn nhà hàng</h2>
            </div>
            <p>Danh sách chi nhánh đang được cập nhật. Hiện tại, bạn có thể đặt bàn tại Bàn Việt.</p>
          </div>

          <article className="landing-card">
            <div className="landing-card__art" aria-hidden="true">BV</div>
            <div className="landing-card__body">
              <div className="landing-card__text">
                <span className="landing-card__status"><i /> Đang hiển thị thực đơn</span>
                <h3>{DEFAULT_RESTAURANT.name}</h3>
                <p>{DEFAULT_RESTAURANT.description}</p>
              </div>
              <div className="landing-card__actions">
                <Link className="landing-link" to={'/restaurants/' + DEFAULT_RESTAURANT.id}>
                  Xem thực đơn
                  <UiIcon name="arrow-right" />
                </Link>
                <Link className="landing-link landing-link--quiet" to={'/booking/' + DEFAULT_RESTAURANT.id}>
                  Đặt bàn ngay
                </Link>
              </div>
            </div>
          </article>
        </section>
      </div>
    </main>
  )
}

export default RestaurantsPage
