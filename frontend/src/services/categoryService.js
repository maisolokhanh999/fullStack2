import { apiRequest } from './apiClient.js'
import {
  encodePathSegment,
  jsonBody,
  unwrapCollection,
  unwrapEntity,
  withQuery,
} from './serviceHelpers.js'

export async function getCategories(query = {}, signal) {
  const response = await apiRequest(
    withQuery('/categories', query),
    { signal },
    'Không thể tải danh mục món ăn.',
  )

  return unwrapCollection(response, 'categories')
}

export async function getCategoryById(id, signal) {
  const response = await apiRequest(
    `/categories/${encodePathSegment(id, 'categoryId')}`,
    { signal },
    'Không thể tải danh mục món ăn.',
  )

  return unwrapEntity(response, 'category')
}

export async function createCategory(payload, signal) {
  const response = await apiRequest(
    '/categories',
    { auth: true, method: 'POST', body: jsonBody(payload), signal },
    'Không thể tạo danh mục món ăn.',
  )

  return unwrapEntity(response, 'category')
}

export async function updateCategory(id, payload, signal) {
  const response = await apiRequest(
    `/categories/${encodePathSegment(id, 'categoryId')}`,
    { auth: true, method: 'PUT', body: jsonBody(payload), signal },
    'Không thể cập nhật danh mục món ăn.',
  )

  return unwrapEntity(response, 'category')
}

export const deleteCategory = (id, signal) =>
  apiRequest(
    `/categories/${encodePathSegment(id, 'categoryId')}`,
    { auth: true, method: 'DELETE', signal },
    'Không thể xóa danh mục món ăn.',
  )
