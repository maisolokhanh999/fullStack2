import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DEFAULT_RESTAURANT } from '../../config/restaurant.js'
import { useBookingDraft } from '../../context/bookingDraftStore.js'
import UiIcon from '../UiIcon.jsx'

const MIN_GUESTS = 1
const MAX_GUESTS = 20
const SEATS_PER_TRAY = 10
const QUICK_SIZES = [2, 4, 6, 8]

const formatNumber = new Intl.NumberFormat('vi-VN')

// Đông hơn một mâm thì nhà hàng tách thành hai mâm đều nhau, đúng cách một
// bữa đông người được xếp chỗ.
const splitIntoTrays = (guests) =>
  guests <= SEATS_PER_TRAY
    ? [guests]
    : [Math.ceil(guests / 2), Math.floor(guests / 2)]

const SEAT_CENTRE = 280
const SEAT_RING = 246

// Toạ độ SVG chỉ cần hai chữ số thập phân; để nguyên số thực của Math.cos sẽ
// nhét những chuỗi như 426.99999999999994 vào DOM mà không thêm độ chính xác.
const round = (value) => Math.round(value * 100) / 100

// Chỗ ngồi rải đều quanh vành, bắt đầu từ đỉnh mâm.
const seatPositions = (count) =>
  Array.from({ length: count }, (_, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / count
    return {
      x: round(SEAT_CENTRE + SEAT_RING * Math.cos(angle)),
      y: round(SEAT_CENTRE + SEAT_RING * Math.sin(angle)),
      // Xoay để mỗi bộ bát đũa quay mặt vào giữa mâm.
      deg: round((angle * 180) / Math.PI + 90),
    }
  })

/* Vành mâm khổng lồ — chỉ là lớp không khí, bị cắt có chủ đích ở mép khung. */
function TrayField() {
  return (
    <svg className="hero__field" viewBox="0 0 1200 1200" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="hero-lacquer" cx="42%" cy="34%" r="76%">
          <stop offset="0%" stopColor="#3a241c" />
          <stop offset="62%" stopColor="#26170f" />
          <stop offset="100%" stopColor="#160c0a" />
        </radialGradient>
      </defs>
      <circle cx="600" cy="600" r="588" fill="url(#hero-lacquer)" />
      <circle className="hero__ring hero__ring--bright" cx="600" cy="600" r="588" />
      <circle className="hero__ring" cx="600" cy="600" r="508" />
      <circle className="hero__ring hero__ring--faint" cx="600" cy="600" r="416" />
    </svg>
  )
}

/* Vòng chỗ ngồi — mỗi người một bát cơm và một đôi đũa. */
function SeatRing({ guests }) {
  return (
    <svg className="hero__seats" viewBox="0 0 560 560" aria-hidden="true" focusable="false">
      <circle className="hero__tray-face" cx={SEAT_CENTRE} cy={SEAT_CENTRE} r={SEAT_RING - 22} />
      <circle className="hero__seat-track" cx={SEAT_CENTRE} cy={SEAT_CENTRE} r={SEAT_RING - 22} />
      {seatPositions(guests).map((seat, index) => (
        <g
          key={index}
          className="hero__seat"
          style={{ '--seat-index': index }}
          transform={`translate(${seat.x} ${seat.y}) rotate(${seat.deg})`}
        >
          <circle className="hero__seat-bowl" r="13" />
          <circle className="hero__seat-rice" r="6" />
          <line className="hero__chopstick" x1="20" y1="-10" x2="20" y2="10" />
          <line className="hero__chopstick" x1="24" y1="-10" x2="24" y2="10" />
        </g>
      ))}
    </svg>
  )
}

function LandingHero() {
  const navigate = useNavigate()
  const { draft, updateInfo } = useBookingDraft()
  const guests = Math.min(MAX_GUESTS, Math.max(MIN_GUESTS, Number(draft.guests) || 2))
  const trays = splitIntoTrays(guests)

  // Chuỗi dọn mâm chỉ chạy một lần lúc mở trang; sau đó mỗi chỗ thêm vào phải
  // hiện ngay để nút bấm không có cảm giác trễ.
  const [isIntro, setIsIntro] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsIntro(false), 2000)
    return () => clearTimeout(timer)
  }, [])

  const clampGuests = (value) => Math.min(MAX_GUESTS, Math.max(MIN_GUESTS, value))
  const setGuests = (value) => updateInfo({ guests: clampGuests(value) })
  const stepGuests = (delta) =>
    updateInfo((current) => ({ guests: clampGuests((Number(current.guests) || 2) + delta) }))

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__inner">
        <div className="hero__copy">
          <span className="hero__eyebrow">Bàn Việt · Đặt chỗ trước</span>
          <h1 className="hero__title" id="hero-title">
            Mâm đã dọn.{' '}
            <span>Còn thiếu chỗ của bạn.</span>
          </h1>
          <p className="hero__lede">
            Chọn số người, đặt cọc để giữ bàn, chọn món trước nếu muốn. Đến nơi, bạn
            báo tên với nhân viên là ngồi vào bàn.
          </p>

          <dl className="hero__facts">
            <div>
              <dt>Giờ phục vụ</dt>
              <dd>{DEFAULT_RESTAURANT.hours}</dd>
            </div>
            <div>
              <dt>Cọc giữ bàn</dt>
              <dd>{DEFAULT_RESTAURANT.depositRate * 100}%</dd>
            </div>
            <div>
              <dt>Tối thiểu mỗi người</dt>
              <dd>{formatNumber.format(DEFAULT_RESTAURANT.minimumSpendPerGuest)}đ</dd>
            </div>
          </dl>
        </div>

        <div className={`hero__stage${isIntro ? ' is-intro' : ''}`}>
          <TrayField />
          <SeatRing guests={guests} />

          <div className="hero__console">
            <span className="hero__console-label" id="hero-party-label">Mấy người ăn?</span>

            <div className="hero__stepper">
              <button
                type="button"
                onClick={() => stepGuests(-1)}
                disabled={guests <= MIN_GUESTS}
                aria-label="Bớt một người"
              >
                <span aria-hidden="true">−</span>
              </button>
              <output aria-live="polite" aria-labelledby="hero-party-label">
                <strong>{guests}</strong>
                <span>người</span>
              </output>
              <button
                type="button"
                onClick={() => stepGuests(1)}
                disabled={guests >= MAX_GUESTS}
                aria-label="Thêm một người"
              >
                <span aria-hidden="true">+</span>
              </button>
            </div>

            <div className="hero__presets" role="group" aria-label="Số người thường đặt">
              {QUICK_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  className={size === guests ? 'is-current' : ''}
                  aria-pressed={size === guests}
                  onClick={() => setGuests(size)}
                >
                  {size}
                </button>
              ))}
            </div>

            <p className="hero__seating-note">
              {trays.length > 1
                ? `Đông thế này nhà hàng dọn hai mâm, ${trays[0]} và ${trays[1]} chỗ.`
                : 'Một mâm, ngồi quây quanh.'}
            </p>

            <button
              type="button"
              className="hero__cta"
              onClick={() => navigate(`/booking/${DEFAULT_RESTAURANT.id}`)}
            >
              Giữ bàn cho {guests} người
              <UiIcon name="arrow-right" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default LandingHero
