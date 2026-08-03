import { apiRequest } from './apiClient.js'
import { encodePathSegment, jsonBody, unwrapEntity } from './serviceHelpers.js'

export async function getInvoiceDetailById(id, signal) {
  const response = await apiRequest(
    `/invoice-details/${encodePathSegment(id, 'invoiceDetailId')}`,
    { auth: true, signal },
    'Không thể tải chi tiết hóa đơn.',
  )

  return unwrapEntity(response, 'invoiceDetail')
}

export async function createInvoiceDetail(payload, signal) {
  const response = await apiRequest(
    '/invoice-details',
    { auth: true, method: 'POST', body: jsonBody(payload), signal },
    'Không thể thêm món vào hóa đơn.',
  )

  return unwrapEntity(response, 'invoiceDetail')
}

export const createInvoiceDetailsBulk = (payload, signal) =>
  apiRequest(
    '/invoice-details/bulk',
    { auth: true, method: 'POST', body: jsonBody(payload), signal },
    'Không thể thêm danh sách món vào hóa đơn.',
  )

export async function updateInvoiceDetail(id, payload, signal) {
  const response = await apiRequest(
    `/invoice-details/${encodePathSegment(id, 'invoiceDetailId')}`,
    { auth: true, method: 'PUT', body: jsonBody(payload), signal },
    'Không thể cập nhật chi tiết hóa đơn.',
  )

  return unwrapEntity(response, 'invoiceDetail')
}

export const deleteInvoiceDetail = (id, signal) =>
  apiRequest(
    `/invoice-details/${encodePathSegment(id, 'invoiceDetailId')}`,
    { auth: true, method: 'DELETE', signal },
    'Không thể xóa món khỏi hóa đơn.',
  )
