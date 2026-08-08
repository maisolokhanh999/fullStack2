import { apiRequest } from './apiClient.js'
import {
  encodePathSegment,
  jsonBody,
  unwrapCollection,
  unwrapEntity,
  withQuery,
} from './serviceHelpers.js'

export async function getMenus(query = {}, signal) {
  const response = await apiRequest(
    withQuery('/menus', query),
    { signal },
    'Không thể tải danh sách thực đơn.',
  )

  return unwrapCollection(response, 'menus')
}

export async function getMenuById(id, signal) {
  const response = await apiRequest(
    `/menus/${encodePathSegment(id, 'menuId')}`,
    { signal },
    'Không thể tải thông tin thực đơn.',
  )

  return unwrapEntity(response, 'menu')
}

export async function createMenu(payload, signal) {
  const response = await apiRequest(
    '/menus',
    { auth: true, method: 'POST', body: jsonBody(payload), signal },
    'Không thể tạo thực đơn.',
  )

  return unwrapEntity(response, 'menu')
}

export async function updateMenu(id, payload, signal) {
  const response = await apiRequest(
    `/menus/${encodePathSegment(id, 'menuId')}`,
    { auth: true, method: 'PUT', body: jsonBody(payload), signal },
    'Không thể cập nhật thực đơn.',
  )

  return unwrapEntity(response, 'menu')
}

export const deleteMenu = (id, signal) =>
  apiRequest(
    `/menus/${encodePathSegment(id, 'menuId')}`,
    { auth: true, method: 'DELETE', signal },
    'Không thể xóa thực đơn.',
  )

export async function restoreMenu(id, signal) {
  const response = await apiRequest(
    `/menus/${encodePathSegment(id, 'menuId')}/restore`,
    { auth: true, method: 'PATCH', signal },
    'Không thể khôi phục thực đơn.',
  )

  return unwrapEntity(response, 'menu')
}

export async function addDishToMenu(id, dishId, signal) {
  const response = await apiRequest(
    `/menus/${encodePathSegment(id, 'menuId')}/items`,
    { auth: true, method: 'POST', body: jsonBody({ dishId }), signal },
    'Không thể thêm món vào thực đơn.',
  )

  return unwrapEntity(response, 'menu')
}

export async function removeDishFromMenu(id, dishId, signal) {
  const response = await apiRequest(
    `/menus/${encodePathSegment(id, 'menuId')}/items/${encodePathSegment(dishId, 'dishId')}`,
    { auth: true, method: 'DELETE', signal },
    'Không thể xóa món khỏi thực đơn.',
  )

  return unwrapEntity(response, 'menu')
}

export async function reorderMenuItems(id, orders, signal) {
  const response = await apiRequest(
    `/menus/${encodePathSegment(id, 'menuId')}/items/reorder`,
    { auth: true, method: 'PUT', body: jsonBody({ orders }), signal },
    'Không thể sắp xếp lại món trong thực đơn.',
  )

  return unwrapEntity(response, 'menu')
}
