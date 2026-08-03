import { apiRequest } from './apiClient.js'
import {
  encodePathSegment,
  jsonBody,
  unwrapCollection,
  unwrapEntity,
  withQuery,
} from './serviceHelpers.js'

export const RESERVATION_API_AVAILABLE = false

export const RESERVATION_CAPABILITIES = Object.freeze({
  create: false,
  history: false,
  search: false,
  tableAssignment: false,
  deposit: false,
  checkIn: false,
  preorder: false,
  invoice: false,
})

export const reservationApiNotice =
  'Frontend đã sẵn sàng với các path mới, nhưng Render chưa chạy route đặt bàn và backend chưa chốt dữ liệu gán bàn, cọc, món đặt trước hoặc check-in.'

export async function getReservations(query = {}, signal) {
  const response = await apiRequest(
    withQuery('/reservations', query),
    { auth: true, signal },
    'Không thể tải danh sách đặt bàn.',
  )

  return unwrapCollection(response, 'reservations')
}

export async function getReservationById(id, signal) {
  const response = await apiRequest(
    `/reservations/${encodePathSegment(id, 'reservationId')}`,
    { auth: true, signal },
    'Không thể tải thông tin đặt bàn.',
  )

  return unwrapEntity(response, 'reservation')
}

export async function createReservation(payload, signal) {
  const response = await apiRequest(
    '/reservations',
    { auth: true, method: 'POST', body: jsonBody(payload), signal },
    'Không thể tạo đặt bàn.',
  )

  return unwrapEntity(response, 'reservation')
}

export async function updateReservation(id, payload, signal) {
  const response = await apiRequest(
    `/reservations/${encodePathSegment(id, 'reservationId')}`,
    { auth: true, method: 'PUT', body: jsonBody(payload), signal },
    'Không thể cập nhật đặt bàn.',
  )

  return unwrapEntity(response, 'reservation')
}

export const deleteReservation = (id, signal) =>
  apiRequest(
    `/reservations/${encodePathSegment(id, 'reservationId')}`,
    { auth: true, method: 'DELETE', signal },
    'Không thể xóa đặt bàn.',
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
  runReservationAction(id, 'confirm', payload, signal, 'Không thể xác nhận đặt bàn.')

export const checkInReservation = (id, payload = {}, signal) =>
  runReservationAction(id, 'checkin', payload, signal, 'Không thể check-in đặt bàn.')

export const completeReservation = (id, payload = {}, signal) =>
  runReservationAction(id, 'complete', payload, signal, 'Không thể hoàn tất đặt bàn.')

export const cancelReservation = (id, payload = {}, signal) =>
  runReservationAction(id, 'cancel', payload, signal, 'Không thể hủy đặt bàn.')

export const markReservationNoShow = (id, payload = {}, signal) =>
  runReservationAction(id, 'no-show', payload, signal, 'Không thể đánh dấu khách không đến.')
