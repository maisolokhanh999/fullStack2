import { apiRequest } from './apiClient.js'
import {
  encodePathSegment,
  jsonBody,
  unwrapCollection,
  unwrapEntity,
  withQuery,
} from './serviceHelpers.js'

export async function getTables(query = {}, signal) {
  const response = await apiRequest(
    withQuery('/tables', query),
    { auth: true, signal },
    'Không thể tải danh sách bàn.',
  )

  return unwrapCollection(response, 'tables')
}

export async function getTableById(id, signal) {
  const response = await apiRequest(
    `/tables/${encodePathSegment(id, 'tableId')}`,
    { auth: true, signal },
    'Không thể tải thông tin bàn.',
  )

  return unwrapEntity(response, 'table')
}

export async function createTable(payload, signal) {
  const response = await apiRequest(
    '/tables',
    { auth: true, method: 'POST', body: jsonBody(payload), signal },
    'Không thể tạo bàn.',
  )

  return unwrapEntity(response, 'table')
}

export async function updateTable(id, payload, signal) {
  const response = await apiRequest(
    `/tables/${encodePathSegment(id, 'tableId')}`,
    { auth: true, method: 'PUT', body: jsonBody(payload), signal },
    'Không thể cập nhật bàn.',
  )

  return unwrapEntity(response, 'table')
}

export const deleteTable = (id, signal) =>
  apiRequest(
    `/tables/${encodePathSegment(id, 'tableId')}`,
    { auth: true, method: 'DELETE', signal },
    'Không thể xóa bàn.',
  )

export async function updateTableStatus(id, statusOrPayload, signal) {
  const payload =
    typeof statusOrPayload === 'string' ? { status: statusOrPayload } : statusOrPayload
  const response = await apiRequest(
    `/tables/${encodePathSegment(id, 'tableId')}/status`,
    { auth: true, method: 'PATCH', body: jsonBody(payload), signal },
    'Không thể cập nhật trạng thái bàn.',
  )

  return unwrapEntity(response, 'table')
}
