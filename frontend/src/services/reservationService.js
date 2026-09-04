import { apiRequest } from './apiClient.js'
import {
  encodePathSegment,
  jsonBody,
  unwrapCollection,
  unwrapEntity,
  withQuery,
} from './serviceHelpers.js'

export const RESERVATION_API_AVAILABLE = true

export const RESERVATION_CAPABILITIES = Object.freeze({
  create: true,
  history: true,
  search: true,
  tableAssignment: false,
  deposit: true,
  checkIn: true,
  preorder: false,
  invoice: false,
})

export const reservationApiNotice =
  'Tính năng đặt bàn trực tuyến đang được hoàn thiện. Một số thao tác hiện chưa khả dụng.'

export async function getReservations(query = {}, signal) {
  const response = await apiRequest(
    withQuery('/reservations', query),
    { auth: true, signal },
    'Không thể tải danh sách đặt bàn.',
  )

  return unwrapCollection(response, 'reservations')
}

// Số điện thoại được lưu ở hai dạng: đặt bàn tạo từ app lấy `user.phone` mà
// User.phone là Number nên mất số 0 đầu ("909709537"), còn đặt bàn nhập trực
// tiếp thì giữ nguyên chuỗi ("0909709537"). Backend lại so khớp tuyệt đối, nên
// nhân viên gõ đúng số khách đọc vẫn có thể không ra kết quả. Thử cả hai dạng
// cho tới khi backend thống nhất kiểu dữ liệu.
const phoneVariants = (value) => {
  if (!/^\d+$/.test(value)) return []
  return value.startsWith('0') ? [value.replace(/^0+/, '')] : [`0${value}`]
}

export const searchReservations = async (query, signal) => {
  const searchValue = String(query).trim()
  const { reservations } = await getReservations({ query: searchValue }, signal)
  if (reservations.length) return reservations

  for (const variant of phoneVariants(searchValue)) {
    const fallback = await getReservations({ query: variant }, signal)
    if (fallback.reservations.length) return fallback.reservations
  }

  return reservations
}

export async function getReservationById(id, signal) {
  const response = await apiRequest(
    `/reservations/${encodePathSegment(id, 'reservationId')}`,
    { auth: true, signal },
    'Không thể tải thông tin đặt bàn.',
  )

  return unwrapEntity(response, 'reservation')
}

export async function getReservationQr(id, signal) {
  const response = await apiRequest(
    `/reservations/${encodePathSegment(id, 'reservationId')}/qr`,
    { auth: true, signal },
    'Không thể tạo mã QR đặt bàn.',
  )
  return unwrapEntity(response, 'reservationQr')
}

export async function createReservation(payload, signal) {
  const response = await apiRequest(
    '/reservations',
    { auth: true, method: 'POST', body: jsonBody(payload), signal },
    'Không thể tạo yêu cầu đặt bàn.',
  )

  return unwrapEntity(response, 'reservation')
}

export async function updateReservation(id, payload, signal) {
  const response = await apiRequest(
    `/reservations/${encodePathSegment(id, 'reservationId')}`,
    { auth: true, method: 'PUT', body: jsonBody(payload), signal },
    'Không thể cập nhật thông tin đặt bàn.',
  )

  return unwrapEntity(response, 'reservation')
}

export const deleteReservation = (id, signal) =>
  apiRequest(
    `/reservations/${encodePathSegment(id, 'reservationId')}`,
    { auth: true, method: 'DELETE', signal },
    'Không thể xóa lượt đặt bàn.',
  )

const runReservationAction = async (id, action, payload, signal, fallbackMessage) => {
  const response = await apiRequest(
    `/reservations/${encodePathSegment(id, 'reservationId')}/${action}`,
    { auth: true, method: 'PATCH', body: jsonBody(payload), signal },
    fallbackMessage,
  )

  return unwrapEntity(response, 'reservation')
}

export const confirmReservation = (id, payload = {}, signal) =>
  runReservationAction(id, 'confirm', payload, signal, 'Không thể xác nhận lượt đặt bàn.')

export const checkInReservation = (id, payload = {}, signal) =>
  runReservationAction(id, 'checkin', payload, signal, 'Không thể xác nhận khách đã đến.')

export const completeReservation = (id, payload = {}, signal) =>
  runReservationAction(id, 'complete', payload, signal, 'Không thể hoàn tất lượt đặt bàn.')

// Backend tự giải phóng bàn khi huỷ / no-show / xoá đặt bàn
// (releaseReservationTables trong reservationController), nên client không
// gọi lại nữa: gọi thêm chỉ tốn request và có thể khiến thao tác đã thành công
// bị báo lỗi nếu bước dọn bàn thừa đó thất bại.
export const cancelReservation = (id, payload = {}, signal) =>
  runReservationAction(id, 'cancel', payload, signal, 'Không thể hủy lượt đặt bàn.')

export const markReservationNoShow = (id, payload = {}, signal) =>
  runReservationAction(id, 'no-show', payload, signal, 'Không thể đánh dấu khách không đến.')
