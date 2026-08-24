import { apiRequest } from './apiClient.js'
import {
  encodePathSegment,
  jsonBody,
  unwrapCollection,
  unwrapEntity,
  withQuery,
} from './serviceHelpers.js'

export async function getReservationTables(query = {}, signal) {
  const response = await apiRequest(
    withQuery('/reservation-tables', query),
    { auth: true, signal },
    'Không thể tải danh sách bàn được gán.',
  )

  return unwrapCollection(response, 'reservationTables')
}

export async function getReservationTableById(id, signal) {
  const response = await apiRequest(
    `/reservation-tables/${encodePathSegment(id, 'reservationTableId')}`,
    { auth: true, signal },
    'Không thể tải thông tin bàn được gán.',
  )

  return unwrapEntity(response, 'reservationTable')
}

export async function getTablesByReservation(reservationId, signal) {
  const response = await apiRequest(
    `/reservation-tables/reservations/${encodePathSegment(reservationId, 'reservationId')}/tables`,
    { auth: true, signal },
    'Không thể tải các bàn của lượt đặt.',
  )

  return unwrapCollection(response, 'tables')
}

export async function createReservationTable(payload, signal) {
  const response = await apiRequest(
    '/reservation-tables',
    { auth: true, method: 'POST', body: jsonBody(payload), signal },
    'Không thể gán bàn cho lượt đặt.',
  )

  return unwrapEntity(response, 'reservationTable')
}

export const deleteReservationTable = async (id, signal) => {
  const reservationTable = await getReservationTableById(id, signal)

  if (reservationTable.status === 'Active') {
    await releaseReservationTable(id, {}, signal)
  }

  return apiRequest(
    `/reservation-tables/${encodePathSegment(id, 'reservationTableId')}`,
    { auth: true, method: 'DELETE', signal },
    'Không thể xóa bàn khỏi lượt đặt.',
  )
}

const runReservationTableAction = async (id, action, payload, signal, fallbackMessage) => {
  const response = await apiRequest(
    `/reservation-tables/${encodePathSegment(id, 'reservationTableId')}/${action}`,
    { auth: true, method: 'PATCH', body: jsonBody(payload), signal },
    fallbackMessage,
  )

  return unwrapEntity(response, 'reservationTable')
}

export const releaseReservationTable = (id, payload = {}, signal) =>
  runReservationTableAction(id, 'release', payload, signal, 'Không thể giải phóng bàn.')

export const blockReservationTable = (id, payload = {}, signal) =>
  runReservationTableAction(id, 'block', payload, signal, 'Không thể khóa bàn.')
