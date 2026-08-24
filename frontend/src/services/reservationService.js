import { apiRequest } from './apiClient.js'
import { getReservationTables, releaseReservationTable } from './reservationTableService.js'
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

export const searchReservations = async (query, signal) => {
  const { reservations } = await getReservations({ query }, signal)
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

export const cancelReservation = (id, payload = {}, signal) =>
  cancelAndReleaseTables(id, payload, signal)

const cancelAndReleaseTables = async (id, payload, signal) => {
  const reservation = await runReservationAction(id, 'cancel', payload, signal, 'Không thể hủy lượt đặt bàn.')
  await releaseTablesForReservation(id, signal)
  return reservation
}

export const markReservationNoShow = (id, payload = {}, signal) =>
  noShowAndReleaseTables(id, payload, signal)

const noShowAndReleaseTables = async (id, payload, signal) => {
  const reservation = await runReservationAction(id, 'no-show', payload, signal, 'Không thể đánh dấu khách không đến.')
  await releaseTablesForReservation(id, signal)
  return reservation
}

const releaseTablesForReservation = async (reservationId, signal) => {
  const { reservationTables } = await getReservationTables({ reservationId }, signal)
  const activeTables = reservationTables.filter((item) => item.status === 'Active')
  await Promise.all(activeTables.map((item) => releaseReservationTable(item._id, {}, signal)))
}
