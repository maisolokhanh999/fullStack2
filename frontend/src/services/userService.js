import { apiRequest } from './apiClient.js'
import {
  encodePathSegment,
  jsonBody,
  unwrapCollection,
  unwrapEntity,
  withQuery,
} from './serviceHelpers.js'

export async function getUsers(query = {}, signal) {
  const response = await apiRequest(
    withQuery('/users', query),
    { auth: true, signal },
    'Không thể tải danh sách người dùng.',
  )

  return unwrapCollection(response, 'users')
}

export async function getUserById(id, signal) {
  const response = await apiRequest(
    `/users/${encodePathSegment(id, 'userId')}`,
    { auth: true, signal },
    'Không thể tải thông tin người dùng.',
  )

  return unwrapEntity(response, 'user')
}

export async function updateUser(id, payload, signal) {
  const response = await apiRequest(
    `/users/${encodePathSegment(id, 'userId')}`,
    { auth: true, method: 'PUT', body: jsonBody(payload), signal },
    'Không thể cập nhật người dùng.',
  )

  return unwrapEntity(response, 'user')
}

export async function updateUserRole(id, role, signal) {
  const response = await apiRequest(
    `/users/${encodePathSegment(id, 'userId')}/role`,
    { auth: true, method: 'PUT', body: jsonBody({ role }), signal },
    'Không thể cập nhật quyền người dùng.',
  )

  return unwrapEntity(response, 'user')
}

export const updateUserPassword = (id, password, signal) =>
  apiRequest(
    `/users/${encodePathSegment(id, 'userId')}/password`,
    { auth: true, method: 'PUT', body: jsonBody({ password }), signal },
    'Không thể cập nhật mật khẩu.',
  )

export const deleteUser = (id, signal) =>
  apiRequest(
    `/users/${encodePathSegment(id, 'userId')}`,
    { auth: true, method: 'DELETE', signal },
    'Không thể xóa người dùng.',
  )
