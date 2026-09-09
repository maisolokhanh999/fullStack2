import { API_BASE_URL } from '../services/apiClient.js'
import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BrandMark } from '../components/AuthIcons.jsx'
import LandingHero from '../components/customer/LandingHero.jsx'
import GatheringTable from '../components/customer/GatheringTable.jsx'
import Reveal from '../components/Reveal.jsx'
import DishCard from '../components/customer/DishCard.jsx'
import DishGridState from '../components/customer/DishGridState.jsx'
import UiIcon from '../components/UiIcon.jsx'
import { DEFAULT_RESTAURANT } from '../config/restaurant.js'
import { useAuth } from '../hooks/useAuth.js'
import { useDishes } from '../hooks/useDishes.js'
import { getLandingPath, isStaffRole } from '../utils/roleNavigation.js'
import { getDishId, isDishAvailable, buildDishCategories } from '../utils/booking.js'

export default function HomePage() {
  const { hash } = useLocation()
  useEffect(() => {
    if (!hash) return
    const frame = requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView())
    return () => cancelAnimationFrame(frame)
  }, [hash])
  const { user, endSession } = useAuth()
  const { dishes, isLoading, error, retry } = useDishes()
  const featured = [...dishes].sort((a, b) => Number(isDishAvailable(b)) - Number(isDishAvailable(a)) || Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured))).slice(0, 4)
  return (
    <div className="bv-home">
      <header className="border-b border-[#e8e1d7] bg-[#fcfaf5]">
        <div className="bv-shell flex min-h-20 flex-wrap items-center justify-between gap-4 py-4">
          <Link className="bv-brand" to="/" aria-label="Bàn Việt trang chủ"><BrandMark /><span>Bàn Việt<span className="block text-[9px] font-medium uppercase tracking-[0.25em] text-[#8c8071]">Bếp Việt · Bàn thân quen</span></span></Link>
          <nav className="flex items-center gap-5 text-[13px] font-semibold sm:gap-8" aria-label="Điều hướng trang chủ">
            <a href="#menu" className="bv-nav-link">Thực đơn</a>
            <a href="#about" className="bv-nav-link hidden sm:inline">Về Bàn Việt</a>
            <a href="#stories" className="bv-nav-link">Câu chuyện</a>
            {isStaffRole(user?.role) && <Link className="bv-nav-link" to={getLandingPath(user)}>Khu làm việc</Link>}
            {user ? <><Link className="bv-nav-link max-w-28 truncate" to="/dashboard">{user.name}</Link><button type="button" className="bv-nav-link" onClick={endSession}>Đăng xuất</button></> : <Link className="bv-nav-link" to="/login">Đăng nhập</Link>}
          </nav>
        </div>
      </header>
      <main>
        <LandingHero />
        <Reveal><GatheringTable /></Reveal>
        <div className="border-y border-[#e8e1d7] bg-[#f0eee6]">
          <div className="bv-shell grid gap-5 py-6 text-sm sm:grid-cols-3">
            {[['01', 'Chọn món bạn thích', 'Thực đơn cập nhật từ nhà hàng'], ['02', 'Hẹn một giờ thật vừa', 'Chọn bàn và số người tham dự'], ['03', 'Đến và cùng thưởng thức', 'Theo dõi lịch hẹn trong tài khoản']].map(([number, title, text]) => <div className="flex items-center gap-4" key={number}><span className="bv-display text-2xl text-[#b4ae9f]">{number}</span><div><strong className="text-[13px] font-semibold">{title}</strong><p className="mt-1 text-xs text-[#7d786d]">{text}</p></div></div>)}
          </div>
        </div>
        <section id="menu" className="bv-shell scroll-mt-6 py-14 lg:py-20" aria-labelledby="menu-heading">
          <Reveal><div className="bv-category-heading"><p className="bv-eyebrow">Chọn vị bạn muốn gặp</p><h2 className="bv-display">Khám phá thực đơn</h2><p>Mỗi món ăn là một lời mời ngồi lại lâu hơn bên nhau.</p></div><div className="bv-categories">{buildDishCategories(dishes).map((category, index) => <Link className={`bv-category bv-category--${index % 4}`} key={category.key} to={`/restaurants?category=${encodeURIComponent(category.key)}`}><span>B.</span><h3>{category.label}</h3><p>{category.count} món trong thực đơn</p><b aria-hidden="true">↗</b></Link>)}</div></Reveal>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div><p className="bv-eyebrow mb-3">Từ căn bếp Bàn Việt</p><h2 id="menu-heading" className="bv-display text-4xl tracking-[-0.03em]">Hôm nay, ăn gì nhỉ?</h2><p className="mt-3 text-sm text-[#746d64]">Một vài gợi ý để bắt đầu bữa ăn của bạn.</p></div>
            <Link to="/restaurants" className="bv-text-link">Xem toàn bộ thực đơn <UiIcon name="arrow-right" /></Link>
          </div>
          <DishGridState isLoading={isLoading} error={error} isEmpty={!isLoading && !error && !dishes.length} onRetry={retry} />
          {!isLoading && !error && <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{featured.map((dish) => <DishCard key={getDishId(dish)} dish={dish} />)}</div>}
        </section>
        <Reveal><section id="about" className="bv-shell pb-16" aria-labelledby="about-heading">
          <div className="grid gap-8 rounded-[24px] bg-[#e9ecdf] px-7 py-10 sm:px-12 lg:grid-cols-[1.2fr_1fr] lg:py-14">
            <div><p className="bv-eyebrow mb-4 text-[#697655]">Những cuộc hẹn giản dị</p><h2 id="about-heading" className="bv-display max-w-lg text-4xl leading-tight tracking-[-0.025em]">Có những điều,<br />ngồi lại mới thấy ngon.</h2></div>
            <div className="max-w-md self-center"><p className="text-sm leading-7 text-[#68705d]">Bữa trưa cùng đồng nghiệp, buổi tối với gia đình hay một cuộc hẹn lâu ngày. Bàn Việt dành chỗ cho những khoảnh khắc ấy, bên hương vị Việt thân quen.</p><Link to={`/booking/${DEFAULT_RESTAURANT.id}`} className="bv-text-link mt-6">Hẹn một bữa tại Bàn Việt <UiIcon name="arrow-up-right" /></Link></div>
          </div>
        </section></Reveal>
        <Reveal><section id="stories" className="bv-shell bv-stories" aria-labelledby="stories-title"><p className="bv-eyebrow">Chuyện quanh bàn ăn</p><h2 id="stories-title" className="bv-display">Mỗi bữa ăn, một dịp ngồi lại.</h2><div className="bv-story-grid">{[
          ['01', 'Bữa cơm nhà, giữa phố', 'Đôi khi điều mình cần chỉ là một bữa ăn quen.', 'Chọn vài món mặn, thêm một món rau và bát canh. Những hương vị giản dị để cả nhà cùng chia sẻ, kể nhau nghe chuyện trong ngày.'],
          ['02', 'Một chiếc bàn cho bạn bè', 'Có những cuộc hẹn chỉ cần đủ người là vui.', 'Gửi một lời hẹn, chọn giờ phù hợp rồi cùng ngồi lại. Đặt món trước là tùy chọn; bạn có thể cùng bạn bè chọn thêm khi đến.'],
          ['03', 'Thong thả từ lúc đặt bàn', 'Chuẩn bị trước một chút, tận hưởng lâu hơn.', 'Chọn số khách, ngày giờ và bàn đủ chỗ. Theo dõi yêu cầu trong tài khoản; nhân viên sẽ xác nhận để buổi gặp của bạn được chuẩn bị chu đáo.'],
        ].map(([number, title, intro, text]) => <article className="bv-story" key={number}><span className="bv-story__number">{number}</span><h3>{title}</h3><p>{intro}</p><details><summary>Đọc câu chuyện <span aria-hidden="true">↗</span></summary><p>{text}</p></details></article>)}</div></section></Reveal>
      </main>
      <footer className="border-t border-[#e8e1d7] bg-[#f5f1e9]">
        <div className="bv-shell flex flex-wrap items-start justify-between gap-8 py-10">
          <div><Link className="bv-brand" to="/"><BrandMark /><span>Bàn Việt</span></Link><p className="mt-4 max-w-xs text-xs leading-6 text-[#80796e]">Một bữa ngon. Một cuộc gặp đáng nhớ.</p></div>
          <div className="text-sm"><strong className="font-semibold">Giờ phục vụ</strong><p className="mt-3 text-[#80796e]">{DEFAULT_RESTAURANT.hours} · Mỗi ngày</p></div>
          <div className="flex flex-col gap-3 text-sm"><Link className="bv-nav-link" to="/restaurants">Thực đơn</Link><Link className="bv-nav-link" to="/bookings">Đặt bàn của bạn</Link></div>
        </div>
        <div className="bv-shell border-t border-[#e3dcd0] py-5 text-[11px] text-[#968b7d]">© {new Date().getFullYear()} Bàn Việt. Ảnh mâm cơm là hình minh họa. <a href={`${API_BASE_URL}/media/credits.html`} target="_blank" rel="noreferrer">Nguồn ảnh món ăn</a></div>
      </footer>
    </div>
  )
}
