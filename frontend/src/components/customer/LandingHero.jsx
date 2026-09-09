import { useNavigate } from 'react-router-dom'
import { DEFAULT_RESTAURANT } from '../../config/restaurant.js'
import { useBookingDraft } from '../../context/bookingDraftStore.js'
import UiIcon from '../UiIcon.jsx'
import heroMeal from '../../assets/hero-meal.png'

export default function LandingHero() {
  const navigate = useNavigate()
  const { draft, updateInfo } = useBookingDraft()
  const guests = Math.min(20, Math.max(1, Number(draft.guests) || 2))
  const changeGuests = (delta) => updateInfo((current) => ({ guests: Math.min(20, Math.max(1, Number(current.guests || 2) + delta)) }))
  return (
    <section className="bv-shell grid items-center gap-10 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:py-16" aria-labelledby="hero-title">
      <div className="max-w-xl">
        <p className="bv-eyebrow mb-5 flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#bd533c]" /> Một bàn ăn. Nhiều câu chuyện.</p>
        <h1 id="hero-title" className="bv-display text-[clamp(42px,5vw,72px)] leading-[1.09] tracking-[-0.045em]">Vị nhà thân quen.<br /><span className="text-[#bd533c]">Hẹn nhau bên bàn.</span></h1>
        <p className="mt-6 max-w-md text-[15px] leading-7 text-[#746d64]">Một bữa cơm ngon, một chỗ ngồi ấm cúng. Khám phá món Việt yêu thích và chuẩn bị trước cho buổi gặp của bạn.</p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <a href="#menu" className="bv-button">Khám phá thực đơn <UiIcon name="arrow-right" /></a>
          <span className="ml-1 text-xs text-[#746d64]">Phục vụ {DEFAULT_RESTAURANT.hours}</span>
        </div>
        <div className="mt-9 border-t border-[#e6dfd5] pt-6">
          <div className="mb-3 text-xs font-semibold text-[#746d64]">ĐẶT BÀN CHO BUỔI GẶP CỦA BẠN</div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-12 items-center gap-4 rounded-xl border border-[#e2dbd2] bg-white px-3">
              <button type="button" className="bv-quantity" disabled={guests <= 1} aria-label="Bớt một người" onClick={() => changeGuests(-1)}>−</button>
              <output aria-live="polite" className="min-w-16 text-center text-sm font-semibold">{guests} người</output>
              <button type="button" className="bv-quantity" disabled={guests >= 20} aria-label="Thêm một người" onClick={() => changeGuests(1)}>+</button>
            </div>
            <button type="button" className="bv-button bv-button--dark" onClick={() => navigate(`/booking/${DEFAULT_RESTAURANT.id}`)}>Đặt bàn trước <UiIcon name="arrow-up-right" /></button>
          </div>
          <p className="mt-3 text-xs text-[#80796e]">Chọn món trước là tùy chọn. Khoản cọc được hiển thị khi đặt bàn.</p>
        </div>
      </div>
      <figure className="relative m-0">
        <img src={heroMeal} alt="Mâm cơm Việt với thịt kho, chả giò và canh rau — ảnh minh họa" className="aspect-[1.06] h-auto w-full rounded-[28px] object-cover lg:aspect-[1.04]" fetchPriority="high" width="1536" height="1024" />
        <figcaption className="absolute bottom-5 left-5 right-5 flex items-center justify-between gap-4 rounded-2xl bg-[#fffdf6]/95 px-5 py-4 shadow-lg backdrop-blur-sm sm:right-auto">
          <div><span className="bv-eyebrow text-[9px]">Bàn Việt</span><p className="mt-1 text-sm font-semibold text-[#302e28]">Ngon hơn khi ngồi cùng nhau.</p></div>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#efe8dc] text-[#7c8b6a]"><UiIcon name="check" /></span>
        </figcaption>
      </figure>
    </section>
  )
}
