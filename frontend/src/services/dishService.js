import { apiRequest } from './apiClient.js'
import {
  encodePathSegment,
  isAbortSignal,
  jsonBody,
  unwrapCollection,
  unwrapEntity,
  withQuery,
} from './serviceHelpers.js'

export async function getDishes(queryOrSignal = {}, signal) {
  const query = isAbortSignal(queryOrSignal) ? { limit: 100 } : queryOrSignal
  const requestSignal = isAbortSignal(queryOrSignal) ? queryOrSignal : signal
  const response = await apiRequest(
    withQuery('/dishes', { limit: 100, ...query }),
    { signal: requestSignal },
    'Chưa thể tải thực đơn. Vui lòng thử lại.',
  )

  return unwrapCollection(response, 'dishes')
}

export async function getDishById(id, signal) {
  const response = await apiRequest(
    `/dishes/${encodePathSegment(id, 'dishId')}`,
    { signal },
    'Không thể tải thông tin món ăn.',
  )

  return unwrapEntity(response, 'dish')
}

export async function createDish(payload, signal) {
  const response = await apiRequest(
    '/dishes',
    { auth: true, method: 'POST', body: jsonBody(payload), signal },
    'Không thể tạo món ăn.',
  )

  return unwrapEntity(response, 'dish')
}

export async function updateDish(id, payload, signal) {
  const response = await apiRequest(
    `/dishes/${encodePathSegment(id, 'dishId')}`,
    { auth: true, method: 'PUT', body: jsonBody(payload), signal },
    'Không thể cập nhật món ăn.',
  )

  return unwrapEntity(response, 'dish')
}

export const deleteDish = (id, signal) =>
  apiRequest(
    `/dishes/${encodePathSegment(id, 'dishId')}`,
    { auth: true, method: 'DELETE', signal },
    'Không thể xóa món ăn.',
  )

export async function restoreDish(id, signal) {
  const response = await apiRequest(
    `/dishes/${encodePathSegment(id, 'dishId')}/restore`,
    { auth: true, method: 'PATCH', signal },
    'Không thể khôi phục món ăn.',
  )

  return unwrapEntity(response, 'dish')
}
