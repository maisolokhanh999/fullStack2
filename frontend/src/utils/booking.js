import { DEFAULT_RESTAURANT } from '../config/restaurant.js'

export const formatCurrency = (value) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)

export const getDishId = (dish) => String(dish?._id || dish?.id || '')

export const getDishImage = (dish) => dish?.imageUrl || dish?.image || dish?.photo || ''

export const getDishPrice = (dish) => Number(dish?.finalPrice ?? dish?.price) || 0

export const isDishAvailable = (dish) =>
  String(dish?.status || '').toLowerCase() === 'available'

export const calculateBookingEstimate = ({ items = [], guests = 1 }) => {
  const dishTotal = items.reduce(
    (total, item) => total + (Number(item.price) || 0) * (Number(item.quantity) || 0),
    0,
  )
  const guestMinimum = Math.max(1, Number(guests) || 1) * DEFAULT_RESTAURANT.minimumSpendPerGuest
  const depositBase = Math.max(dishTotal, guestMinimum)

  return {
    dishTotal,
    guestMinimum,
    depositBase,
    estimatedDeposit: Math.round(depositBase * DEFAULT_RESTAURANT.depositRate),
  }
}

export const getTodayString = () => {
  const today = new Date()
  const offset = today.getTimezoneOffset()
  return new Date(today.getTime() - offset * 60000).toISOString().slice(0, 10)
}
