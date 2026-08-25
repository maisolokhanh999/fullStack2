import { useEffect, useRef, useState } from 'react'
import { DEFAULT_RESTAURANT } from '../../config/restaurant.js'

// Bốn bước này là quy trình thật của app: giữ chỗ có cọc, chọn món là tùy chọn,
// nhân viên check-in khi khách tới, và món chỉ xuống bếp sau bước đó.
const steps = [
  { title: 'Giữ chỗ', body: `Chọn số người và đặt cọc ${DEFAULT_RESTAURANT.depositRate * 100}%. Bàn được giữ cho riêng bạn.` },
  { title: 'Chọn món trước', body: 'Không bắt buộc. Chọn sẵn thì lúc đến chỉ việc ngồi xuống.' },
  { title: 'Đến nơi, báo tên', body: 'Nhân viên đối chiếu giờ hẹn, số khách và khoản cọc rồi xác nhận bạn đã đến.' },
  { title: 'Bếp bắt đầu', body: 'Món chỉ được chuyển xuống bếp sau khi bạn đã ngồi vào bàn, nên đồ ăn ra nóng.' },
]

const CENTRE = 300
// Năm món quanh mâm, mỗi món một dáng để không đọc thành chấm bi đều tăm tắp.
const DISHES = [
  { radius: 46, garnish: 20, kind: 'solid' },
  { radius: 41, garnish: 17, kind: 'ring' },
  { radius: 48, garnish: 23, kind: 'braised' },
  { radius: 40, garnish: 16, kind: 'solid' },
  { radius: 44, garnish: 19, kind: 'ring' },
]

const round = (value) => Math.round(value * 100) / 100

const ringPoints = (count, radius) =>
  Array.from({ length: count }, (_, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / count
    return {
      x: round(CENTRE + radius * Math.cos(angle)),
      y: round(CENTRE + radius * Math.sin(angle)),
      deg: round((angle * 180) / Math.PI + 90),
    }
  })

function ServingSequence() {
  const sectionRef = useRef(null)
  const [isServed, setIsServed] = useState(false)

  // Chuỗi dọn mâm chạy một lần khi mục này lọt vào tầm nhìn, không lặp lại
  // mỗi lần cuộn qua — lặp lại sẽ thành thứ gây phiền hơn là gây ấn tượng.
  useEffect(() => {
    const node = sectionRef.current
    if (!node) return undefined

    if (typeof IntersectionObserver !== 'function') {
      setIsServed(true)
      return undefined
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setIsServed(true)
        observer.disconnect()
      }
    }, { threshold: 0.35 })

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const dishPoints = ringPoints(DISHES.length, 128)
  const seatPoints = ringPoints(4, 250)

  return (
    <section
      ref={sectionRef}
      className={`serving${isServed ? ' is-served' : ''}`}
      aria-labelledby="serving-heading"
    >
      <div className="serving__inner">
        <div className="serving__copy">
          <span className="serving__eyebrow">Cách một bữa ăn diễn ra</span>
          <h2 id="serving-heading">Mâm chỉ dọn ra khi bạn đã ngồi xuống.</h2>

          <ol className="serving__steps">
            {steps.map((step, index) => (
              <li key={step.title} style={{ '--step-index': index }}>
                <span className="serving__step-number">{index + 1}</span>
                <div>
                  <strong>{step.title}</strong>
                  <p>{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="serving__stage">
          <svg className="serving__tray" viewBox="0 0 600 600" aria-hidden="true" focusable="false">
            <defs>
              <radialGradient id="serving-lacquer" cx="40%" cy="32%" r="74%">
                <stop offset="0%" stopColor="#3a241c" />
                <stop offset="62%" stopColor="#26170f" />
                <stop offset="100%" stopColor="#160c0a" />
              </radialGradient>
            </defs>

            <circle className="serving__rim" cx={CENTRE} cy={CENTRE} r="196" />
            <circle cx={CENTRE} cy={CENTRE} r="190" fill="url(#serving-lacquer)" />
            <circle className="serving__inlay" cx={CENTRE} cy={CENTRE} r="176" />

            {/* Chỗ ngồi quanh mâm — hiện trước, bàn dọn sau */}
            {seatPoints.map((seat, index) => (
              <g key={`seat-${index}`} className="serving__seat" style={{ '--seat-index': index }}
                transform={`translate(${seat.x} ${seat.y}) rotate(${seat.deg})`}>
                <circle className="serving__seat-bowl" r="16" />
                <circle className="serving__seat-rice" r="7" />
                <line className="serving__chopstick" x1="24" y1="-12" x2="24" y2="12" />
                <line className="serving__chopstick" x1="29" y1="-12" x2="29" y2="12" />
              </g>
            ))}

            {/* Bát nước mắm vào giữa trước tiên */}
            <g className="serving__centre">
              <circle className="serving__dish-rim" cx={CENTRE} cy={CENTRE} r="38" />
              <circle className="serving__sauce" cx={CENTRE} cy={CENTRE} r="24" />
            </g>

            {/* Rồi từng món lần lượt đáp xuống */}
            {dishPoints.map((point, index) => {
              const dish = DISHES[index]
              return (
                <g key={`dish-${index}`} className="serving__dish" style={{ '--dish-index': index }}>
                  <circle className="serving__dish-rim" cx={point.x} cy={point.y} r={dish.radius} />
                  {dish.kind === 'ring' ? (
                    <circle className="serving__broth" cx={point.x} cy={point.y} r={dish.garnish} />
                  ) : (
                    <circle
                      className={dish.kind === 'braised' ? 'serving__garnish serving__garnish--braised' : 'serving__garnish'}
                      cx={point.x} cy={point.y} r={dish.garnish}
                    />
                  )}
                </g>
              )
            })}
          </svg>
        </div>
      </div>
    </section>
  )
}

export default ServingSequence
