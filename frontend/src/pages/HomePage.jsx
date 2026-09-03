import { Link } from 'react-router-dom'
import LandingHero from '../components/customer/LandingHero.jsx'
import UiIcon from '../components/UiIcon.jsx'
import { DEFAULT_RESTAURANT } from '../config/restaurant.js'
import { useAuth } from '../hooks/useAuth.js'
import { useDishes } from '../hooks/useDishes.js'
import { formatCurrency, getDishId, getDishPrice } from '../utils/booking.js'

const menuHighlights = [
  { title: 'Món khai vị', detail: 'Nhẹ nhàng mở đầu câu chuyện', tone: 'warm' },
  { title: 'Cơm & món mặn', detail: 'Hương vị thân quen của mâm cơm Việt', tone: 'red' },
  { title: 'Canh & món nước', detail: 'Tròn vị, thanh lành, vừa đủ ấm', tone: 'green' },
  { title: 'Đồ uống', detail: 'Một chút thư thả cho cuộc gặp', tone: 'gold' },
]

const stories = [
  { date: '08.07', title: 'Một bữa cơm Việt, nhiều câu chuyện để kể' },
  { date: '16.01', title: 'Từ căn bếp nhỏ đến mâm cơm trọn vẹn' },
  { date: '23.12', title: 'Gặp nhau bên những món ăn thân thuộc' },
]

function HomePage() {
  const { user, endSession } = useAuth()
  const { dishes } = useDishes()
  const promotedDishes = dishes.filter((dish) => dish.isFeatured || Number(dish.discount) > 0).slice(0, 4)

  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="home-hero__nav">
          <Link className="home-brand" to="/" aria-label="Bàn Việt trang chủ">
            <span>BV</span>
            <strong>Bàn Việt</strong>
          </Link>
          <nav aria-label="Điều hướng trang chủ">
            <a href="#menu">Thực đơn</a>
            <a href="#stories">Câu chuyện</a>
            <Link className="home-nav-cta" to="/restaurants">Đặt món</Link>
            {user ? (
              <div className="home-account">
                <Link to="/dashboard" className="home-account__name">{user.name || user.email}</Link>
                <button type="button" onClick={endSession}>Đăng xuất</button>
              </div>
            ) : (
              <Link className="home-login-link" to="/login">Đăng nhập</Link>
            )}
          </nav>
        </div>
        <LandingHero />
      </section>

      <section className="home-menu" id="menu" aria-labelledby="home-menu-title">
        <div className="home-section-heading">
          <span>Chọn vị bạn muốn gặp</span>
          <h1 id="home-menu-title">Khám phá thực đơn</h1>
          <p>Mỗi món ăn là một lời mời ngồi lại lâu hơn bên nhau.</p>
        </div>
        <div className="home-menu-grid">
          {menuHighlights.map((item) => (
            <Link className={'home-menu-card home-menu-card--' + item.tone} key={item.title} to="/restaurants">
              <span className="home-menu-card__mark">BV</span>
              <strong>{item.title}</strong>
              <p>{item.detail}</p>
              <UiIcon name="arrow-right" />
            </Link>
          ))}
        </div>
        <Link className="home-outline-link" to="/restaurants">Xem toàn bộ thực đơn <UiIcon name="arrow-right" /></Link>
      </section>

      <section className="home-recommendations" aria-labelledby="home-recommendations-title">
        <div className="home-recommendations__heading">
          <div>
            <span>Được khách yêu thích</span>
            <h2 id="home-recommendations-title">Lựa chọn ưu đãi tốt</h2>
            <p>Khám phá những nhóm món đang được quan tâm tại Bàn Việt.</p>
          </div>
          <Link to="/restaurants" aria-label="Xem thực đơn"><UiIcon name="arrow-right" /></Link>
        </div>
        <div className="home-recommendations__track">
          {menuHighlights.map((item, index) => (
            <Link className={'home-recommendation-card home-recommendation-card--' + item.tone} key={item.title} to="/restaurants">
              <span className="home-recommendation-card__badge">Được đề xuất</span>
              <div className="home-recommendation-card__visual"><span>{String(index + 1).padStart(2, '0')}</span></div>
              <div className="home-recommendation-card__body">
                <strong>{item.title} tại Bàn Việt</strong>
                <p>{item.detail}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-featured-area">
        {promotedDishes.length > 0 && (
          <section className="home-promotions" aria-labelledby="home-promotions-title">
          <div className="home-section-heading">
            <span>Đang được yêu thích</span>
            <h2 id="home-promotions-title">Món nổi bật và ưu đãi</h2>
            <p>Cập nhật trực tiếp từ thực đơn của Bàn Việt.</p>
          </div>
          <div className="home-promotion-grid">
            {promotedDishes.map((dish) => (
              <Link className="home-promotion-card" key={getDishId(dish)} to="/restaurants">
                <div className="home-promotion-card__badges">
                  {dish.isFeatured && <span className="home-promotion-card__badge">Nổi bật</span>}
                  {Number(dish.discount) > 0 && <span className="home-promotion-card__badge home-promotion-card__badge--discount">-{dish.discount}%</span>}
                </div>
                <div className="home-promotion-card__visual">
                  {dish.image ? <img src={dish.image} alt="" /> : <span>{dish.name.slice(0, 1)}</span>}
                </div>
                <div><strong>{dish.name}</strong><p><b>{formatCurrency(getDishPrice(dish))}</b>{Number(dish.discount) > 0 && <del>{formatCurrency(dish.price)}</del>}</p></div>
              </Link>
            ))}
          </div>
          </section>
        )}

        <section className="home-stories" id="stories" aria-labelledby="home-stories-title">
        <div className="home-section-heading">
          <span>Góc Bàn Việt</span>
          <h2 id="home-stories-title">Ưu đãi và câu chuyện</h2>
        </div>
        <div className="home-story-grid">
          {stories.map((story) => (
            <article className="home-story-card" key={story.date}>
              <span>{story.date}</span>
              <div className="home-story-card__image" aria-hidden="true" />
              <h3>{story.title}</h3>
              <a href="#stories">Đọc tiếp <UiIcon name="arrow-right" /></a>
            </article>
          ))}
        </div>
        </section>
      </section>

      <footer className="home-footer">
        <div><strong>Bàn Việt</strong><p>{DEFAULT_RESTAURANT.description}</p></div>
        <div><strong>Liên hệ</strong><p>{DEFAULT_RESTAURANT.hours}<br />{DEFAULT_RESTAURANT.address}</p></div>
        <Link className="home-footer__cta" to={'/booking/' + DEFAULT_RESTAURANT.id}>Giữ bàn ngay <UiIcon name="arrow-right" /></Link>
      </footer>
    </main>
  )
}

export default HomePage
