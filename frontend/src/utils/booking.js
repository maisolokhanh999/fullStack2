import { DEFAULT_RESTAURANT } from '../config/restaurant.js'

export const formatCurrency = (value) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)

export const getDishId = (dish) => String(dish?._id || dish?.id || '')

export const getDishImage = (dish) => dish?.imageUrl || dish?.image || dish?.photo || ''

export const getDishPrice = (dish) => {
  const finalPrice = Number(dish?.finalPrice)
  if (
    dish?.finalPrice !== undefined &&
    dish?.finalPrice !== null &&
    dish?.finalPrice !== '' &&
    Number.isFinite(finalPrice)
  ) {
    return Math.max(0, finalPrice)
  }

  const price = Number(dish?.price)
  if (!Number.isFinite(price)) return 0

  const discount = Math.min(100, Math.max(0, Number(dish?.discount) || 0))
  return Math.max(0, price - (price * discount) / 100)
}

const dishTypeLabels = {
  MainCourse: 'Món chính',
  SideDish: 'Món phụ',
  Drink: 'Đồ uống',
  Dessert: 'Tráng miệng',
}

export const getDishCategoryLabel = (dish) =>
  dish?.categoryId?.name || dishTypeLabels[dish?.type] || 'Thực đơn'

export const getDishServingUnit = (dish) => String(dish?.servingUnit || '').trim()

export const getDishStock = (dish) => {
  if (dish?.stock === undefined || dish?.stock === null || dish?.stock === '') return null
  const stock = Number(dish.stock)
  return Number.isFinite(stock) ? Math.max(0, Math.floor(stock)) : null
}

export const isDishAvailable = (dish) =>
  String(dish?.status || '').toLowerCase() === 'available' && getDishStock(dish) !== 0

export const getDishQuantityLimit = (dish) => {
  const stock = getDishStock(dish)
  return stock === null ? 20 : Math.min(20, stock)
}

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

export const getDishDetailPath = (dish, restaurantId = DEFAULT_RESTAURANT.id) =>
  `/restaurants/${restaurantId}/dishes/${getDishId(dish)}`

// Bỏ dấu trước khi so khớp: khách tìm nhanh thường gõ "pho bo", "ca phe" chứ
// không bỏ công gõ đủ dấu. NFD tách được dấu thanh nhưng không tách chữ đ nên
// phải thay riêng.
export const normalizeText = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/đ/g, 'd')
    .trim()

// Khoá gom nhóm của một món: ưu tiên id danh mục thật, rơi về loại món cho
// những món chưa gắn danh mục — khớp với thứ getDishCategoryLabel hiển thị.
export const getDishCategoryKey = (dish) =>
  String(dish?.categoryId?._id || dish?.categoryId || dish?.type || 'khac')

// Danh mục dựng từ chính danh sách món đang có, không gọi thêm API. Nhờ vậy
// không bao giờ hiện một thư mục rỗng để khách bấm vào rồi chẳng thấy gì.
export const buildDishCategories = (dishes) => {
  const groups = new Map()

  for (const dish of dishes) {
    const key = getDishCategoryKey(dish)
    const group = groups.get(key)

    if (group) group.count += 1
    else groups.set(key, { key, label: getDishCategoryLabel(dish), count: 1 })
  }

  return [...groups.values()].sort((a, b) => a.label.localeCompare(b.label, 'vi'))
}

export const dishMatchesQuery = (dish, query) => {
  const needle = normalizeText(query)
  if (!needle) return true

  return [dish?.name, dish?.description, getDishCategoryLabel(dish), dish?.code]
    .some((field) => normalizeText(field).includes(needle))
}
