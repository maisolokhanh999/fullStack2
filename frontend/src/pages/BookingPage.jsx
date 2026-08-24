import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import DishGridState from '../components/customer/DishGridState.jsx'
import DishVisual from '../components/customer/DishVisual.jsx'
import UiIcon from '../components/UiIcon.jsx'
import { DEFAULT_RESTAURANT, isDefaultRestaurant } from '../config/restaurant.js'
import { useBookingDraft } from '../context/bookingDraftStore.js'
import { useDishes } from '../hooks/useDishes.js'
import { useAuth } from '../hooks/useAuth.js'
import { createReservation } from '../services/reservationService.js'
import {
  calculateBookingEstimate,
  formatCurrency,
  getDishCategoryLabel,
  getDishId,
  getDishPrice,
  getDishQuantityLimit,
  getDishServingUnit,
  getTodayString,
  isDishAvailable,
} from '../utils/booking.js'

const steps = [
  { number: 1, label: 'Thông tin bàn' },
  { number: 2, label: 'Chọn món' },
  { number: 3, label: 'Xem lại và đặt cọc' },
]

const OPENING_TIME = '10:00'
const LAST_BOOKING_TIME = '21:30'

const isValidDateString = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false

  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  )
}

function BookingPage() {
  const { restaurantId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { draft, updateInfo, setItemQuantity, reconcileItems, clearDraft } = useBookingDraft()
  const { dishes, isLoading, error, retry } = useDishes()

  const estimate = useMemo(
    () => calculateBookingEstimate({ items: draft.items, guests: draft.guests }),
    [draft.items, draft.guests],
  )

  useEffect(() => {
    if (isLoading || error) return

    reconcileItems(dishes)
  }, [dishes, error, isLoading, reconcileItems])

  if (!isDefaultRestaurant(restaurantId)) {
    return (
      <main className="customer-main">
        <div className="customer-empty-card">
          <span>404</span>
          <h1>Không tìm thấy nhà hàng</h1>
          <Link className="customer-primary-link" to="/restaurants">Chọn nhà hàng khác</Link>
        </div>
      </main>
    )
  }

  const validateInfo = () => {
    const nextErrors = {}
    const today = getTodayString()
    const visitDate = String(draft.visitDate || '')
    const visitTime = String(draft.visitTime || '')

    if (!visitDate) {
      nextErrors.visitDate = 'Vui lòng chọn ngày đến.'
    } else if (!isValidDateString(visitDate)) {
      nextErrors.visitDate = 'Ngày đến chưa hợp lệ.'
    } else if (visitDate < today) {
      nextErrors.visitDate = 'Ngày đến không thể nằm trong quá khứ.'
    }

    if (!visitTime) {
      nextErrors.visitTime = 'Vui lòng chọn giờ đến.'
    } else if (
      !/^\d{2}:\d{2}$/.test(visitTime) ||
      visitTime < OPENING_TIME ||
      visitTime > LAST_BOOKING_TIME
    ) {
      nextErrors.visitTime = 'Vui lòng chọn giờ từ 10:00 đến 21:30.'
    }

    if (!nextErrors.visitDate && !nextErrors.visitTime && visitDate === today) {
      const now = new Date()
      const currentTime = String(now.getHours()).padStart(2, '0') + ':' +
        String(now.getMinutes()).padStart(2, '0')
      if (visitTime <= currentTime) {
        nextErrors.visitTime = 'Giờ hẹn hôm nay cần muộn hơn thời điểm hiện tại.'
      }
    }
    if (Number(draft.guests) < 1 || Number(draft.guests) > 20) {
      nextErrors.guests = 'Số khách cần từ 1 đến 20 người.'
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const goToMenu = (event) => {
    event.preventDefault()
    if (validateInfo()) setStep(2)
  }

  const updateDraftField = (event) => {
    const { name, value } = event.target
    updateInfo({ [name]: name === 'guests' ? Number(value) : value })
    setErrors((current) => ({ ...current, [name]: '' }))
  }

  const quantityFor = (dish) =>
    draft.items.find((item) => item.dishId === getDishId(dish))?.quantity || 0

  const changeQuantity = (dish, delta) => {
    const nextQuantity = Math.max(
      0,
      Math.min(getDishQuantityLimit(dish), quantityFor(dish) + delta),
    )
    setItemQuantity(dish, nextQuantity)
  }

  const submitReservation = async () => {
    if (!user?.name || !user?.phone) {
      setSubmitError('Vui lòng cập nhật họ tên và số điện thoại trong tài khoản trước khi đặt bàn.')
      return
    }

    setIsSubmitting(true)
    setSubmitError('')

    try {
      await createReservation({
        customerName: user.name,
        customerPhone: user.phone,
        numberOfGuests: draft.guests,
        expectedCheckInTime: `${draft.visitDate}T${draft.visitTime}:00`,
        reservationType: 'Online',
        note: draft.note,
        depositAmount: estimate.estimatedDeposit,
      })
      clearDraft()
      navigate('/bookings', { replace: true, state: { reservationSubmitted: true } })
    } catch (requestError) {
      setSubmitError(requestError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="customer-main booking-main">
      <div className="booking-heading">
        <div>
          <Link className="back-link" to={'/restaurants/' + DEFAULT_RESTAURANT.id}>
            <UiIcon name="arrow-left" />
            Quay lại thực đơn
          </Link>
          <span className="customer-kicker">Đặt bàn tại {DEFAULT_RESTAURANT.name}</span>
          <h1>Chuẩn bị trước, thảnh thơi khi đến.</h1>
        </div>
        <p>Bản nháp được lưu trên trình duyệt này cho đến khi bạn xóa.</p>
      </div>

      <ol className="booking-steps" aria-label="Các bước đặt bàn">
        {steps.map((item) => (
          <li
            key={item.number}
            aria-current={step === item.number ? 'step' : undefined}
            aria-label={`${item.label}${step > item.number ? ' — đã hoàn thành' : ''}`}
            className={
              (step === item.number ? 'is-active ' : '') +
              (step > item.number ? 'is-complete' : '')
            }
          >
            <span>{step > item.number ? <UiIcon name="check" /> : item.number}</span>
            <strong>{item.label}</strong>
          </li>
        ))}
      </ol>

      <section className="booking-panel">
        {step === 1 && (
          <form className="booking-info-form" onSubmit={goToMenu} noValidate>
            <header>
              <span className="customer-kicker">Bước 1</span>
              <h2>Khi nào bạn muốn đến?</h2>
              <p>Nhân viên sẽ dùng thông tin này để chuẩn bị bàn phù hợp.</p>
            </header>

            <div className="booking-form-grid">
              <label className="booking-field">
                <span>Ngày đến</span>
                <input
                  name="visitDate"
                  type="date"
                  min={getTodayString()}
                  value={draft.visitDate}
                  onChange={updateDraftField}
                  aria-invalid={Boolean(errors.visitDate)}
                />
                {errors.visitDate && <small>{errors.visitDate}</small>}
              </label>

              <label className="booking-field">
                <span>Giờ đến</span>
                <input
                  name="visitTime"
                  type="time"
                  min={OPENING_TIME}
                  max={LAST_BOOKING_TIME}
                  value={draft.visitTime}
                  onChange={updateDraftField}
                  aria-invalid={Boolean(errors.visitTime)}
                />
                {errors.visitTime && <small>{errors.visitTime}</small>}
              </label>

              <label className="booking-field">
                <span>Số khách</span>
                <select name="guests" value={draft.guests} onChange={updateDraftField}>
                  {Array.from({ length: 20 }, (_, index) => index + 1).map((value) => (
                    <option value={value} key={value}>{value} người</option>
                  ))}
                </select>
                {errors.guests && <small>{errors.guests}</small>}
              </label>

              <label className="booking-field booking-field--note">
                <span>Ghi chú cho nhà hàng <i>Tùy chọn</i></span>
                <textarea
                  name="note"
                  rows="3"
                  maxLength="300"
                  placeholder="Ví dụ: cần ghế trẻ em, bàn gần cửa sổ..."
                  value={draft.note}
                  onChange={updateDraftField}
                />
                <em>{draft.note.length}/300</em>
              </label>
            </div>

            <div className="booking-actions">
              <Link className="customer-secondary-link" to="/restaurants">Hủy</Link>
              <button className="customer-primary-button" type="submit">
                Tiếp tục chọn món
                <UiIcon name="arrow-right" />
              </button>
            </div>
          </form>
        )}

        {step === 2 && (
          <div className="booking-menu">
            <header className="booking-panel__header">
              <div>
                <span className="customer-kicker">Bước 2 · Tùy chọn</span>
                <h2>Bạn muốn đặt trước món nào?</h2>
                <p>Không bắt buộc chọn món. Món chỉ được chuyển xuống bếp sau khi nhân viên xác nhận bạn đã đến.</p>
              </div>
              <button className="skip-button" type="button" onClick={() => setStep(3)}>
                Bỏ qua chọn món
              </button>
            </header>

            <DishGridState
              isLoading={isLoading}
              error={error}
              isEmpty={!isLoading && !error && dishes.length === 0}
              onRetry={retry}
            />

            {!isLoading && !error && dishes.length > 0 && (
              <div className="booking-dish-list">
                {dishes.map((dish) => {
                  const available = isDishAvailable(dish)
                  const quantity = quantityFor(dish)
                  const categoryLabel = getDishCategoryLabel(dish)
                  const servingUnit = getDishServingUnit(dish)
                  const quantityLimit = getDishQuantityLimit(dish)

                  return (
                    <article className={'booking-dish' + (!available ? ' is-unavailable' : '')} key={getDishId(dish)}>
                      <DishVisual dish={dish} compact />
                      <div className="booking-dish__copy">
                        <span>
                          {dish.isFeatured && <UiIcon name="star" />}
                          {dish.isFeatured && <span>Nổi bật ·</span>}
                          {categoryLabel}
                          {servingUnit && ` · ${servingUnit}`}
                        </span>
                        <h3>{dish.name}</h3>
                        <strong>{formatCurrency(getDishPrice(dish))}</strong>
                      </div>
                      {available ? (
                        <div className="quantity-control" aria-label={'Số lượng ' + dish.name}>
                          <button
                            type="button"
                            onClick={() => changeQuantity(dish, -1)}
                            disabled={quantity === 0}
                            aria-label={'Giảm ' + dish.name}
                          >
                            −
                          </button>
                          <span>{quantity}</span>
                          <button
                            type="button"
                            onClick={() => changeQuantity(dish, 1)}
                            disabled={quantity >= quantityLimit}
                            aria-label={'Thêm ' + dish.name}
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <span className="unavailable-label">Tạm hết</span>
                      )}
                    </article>
                  )
                })}
              </div>
            )}

            <div className="booking-menu-summary">
              <span>Tổng số lượng: {draft.items.reduce((total, item) => total + item.quantity, 0)}</span>
              <strong>{formatCurrency(estimate.dishTotal)}</strong>
            </div>

            <div className="booking-actions">
              <button className="customer-secondary-button" type="button" onClick={() => setStep(1)}>
                Quay lại
              </button>
              <button className="customer-primary-button" type="button" onClick={() => setStep(3)}>
                Xem lại đặt bàn
                <UiIcon name="arrow-right" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="booking-review">
            <header>
              <span className="customer-kicker">Bước 3</span>
              <h2>Xem lại bản nháp đặt bàn</h2>
              <p>Thông tin dưới đây chưa phải là yêu cầu đặt bàn đã được xác nhận.</p>
            </header>

            <div className="review-grid">
              <div className="review-card">
                <span>Thông tin đặt bàn</span>
                <dl>
                  <div><dt>Nhà hàng</dt><dd>{DEFAULT_RESTAURANT.name}</dd></div>
                  <div><dt>Ngày đến</dt><dd>{draft.visitDate || 'Chưa chọn'}</dd></div>
                  <div><dt>Giờ đến</dt><dd>{draft.visitTime || 'Chưa chọn'}</dd></div>
                  <div><dt>Số khách</dt><dd>{draft.guests} người</dd></div>
                  {draft.note && <div><dt>Ghi chú</dt><dd>{draft.note}</dd></div>}
                </dl>
              </div>

              <div className="review-card">
                <span>Món đặt trước</span>
                {draft.items.length ? (
                  <ul className="review-items">
                    {draft.items.map((item) => (
                      <li key={item.dishId}>
                        <span>{item.quantity} × {item.name}</span>
                        <strong>{formatCurrency(item.price * item.quantity)}</strong>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="review-empty">Không chọn món trước. Bạn vẫn có thể đặt bàn.</p>
                )}
              </div>
            </div>

            <div className="deposit-estimate">
              <div className="deposit-estimate__heading">
                <div>
                  <span>Ước tính khoản cọc</span>
                  <strong>{formatCurrency(estimate.estimatedDeposit)}</strong>
                </div>
                <span className="estimate-pill">Tạm tính 20%</span>
              </div>
              <dl>
                <div><dt>Tiền món đã chọn</dt><dd>{formatCurrency(estimate.dishTotal)}</dd></div>
                <div><dt>Mức tối thiểu ({draft.guests} × 100.000đ)</dt><dd>{formatCurrency(estimate.guestMinimum)}</dd></div>
                <div><dt>Số tiền dùng để tính cọc</dt><dd>{formatCurrency(estimate.depositBase)}</dd></div>
              </dl>
              <p>
                Đây chỉ là số tiền tạm tính. Nhà hàng sẽ kiểm tra tình trạng bàn và xác nhận
                số tiền cọc trước khi thanh toán.
              </p>
            </div>

            {submitError && <div className="api-pending-notice" role="alert"><span><UiIcon name="info" /></span><div><strong>Không thể gửi yêu cầu đặt bàn</strong><p>{submitError}</p></div></div>}

            <div className="booking-actions booking-actions--review">
              <button className="customer-secondary-button" type="button" onClick={() => setStep(2)}>
                Chỉnh sửa
              </button>
              <Link className="customer-secondary-link" to="/bookings">Xem bản nháp</Link>
              <button className="customer-primary-button" type="button" onClick={submitReservation} disabled={isSubmitting}>
                {isSubmitting ? 'Đang gửi yêu cầu...' : 'Gửi yêu cầu đặt bàn'}
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}

export default BookingPage
