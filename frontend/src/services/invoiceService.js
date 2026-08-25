import { apiRequest } from './apiClient.js'
import {
  encodePathSegment,
  jsonBody,
  unwrapCollection,
  unwrapEntity,
  withQuery,
} from './serviceHelpers.js'

export async function getInvoices(query = {}, signal) {
  const response = await apiRequest(
    withQuery('/invoices', query),
    { auth: true, signal },
    'Không thể tải danh sách hóa đơn.',
  )

  return unwrapCollection(response, 'invoices')
}

export async function getInvoiceById(id, signal) {
  const response = await apiRequest(
    `/invoices/${encodePathSegment(id, 'invoiceId')}`,
    { auth: true, signal },
    'Không thể tải thông tin hóa đơn.',
  )

  return unwrapEntity(response, 'invoice')
}

export async function getInvoiceByReservation(reservationId, signal) {
  const response = await apiRequest(
    `/invoices/reservation/${encodePathSegment(reservationId, 'reservationId')}`,
    { auth: true, signal },
    'Không thể tải hóa đơn hiện tại.',
  )
  return unwrapEntity(response, 'invoice')
}

export async function createInvoice(payload, signal) {
  const response = await apiRequest(
    '/invoices',
    { auth: true, method: 'POST', body: jsonBody(payload), signal },
    'Không thể tạo hóa đơn.',
  )

  return unwrapEntity(response, 'invoice')
}

export async function updateInvoice(id, payload, signal) {
  const response = await apiRequest(
    `/invoices/${encodePathSegment(id, 'invoiceId')}`,
    { auth: true, method: 'PUT', body: jsonBody(payload), signal },
    'Không thể cập nhật hóa đơn.',
  )

  return unwrapEntity(response, 'invoice')
}

export const deleteInvoice = (id, signal) =>
  apiRequest(
    `/invoices/${encodePathSegment(id, 'invoiceId')}`,
    { auth: true, method: 'DELETE', signal },
    'Không thể xóa hóa đơn.',
  )

const runInvoiceAction = async (id, action, payload, signal, fallbackMessage) => {
  const response = await apiRequest(
    `/invoices/${encodePathSegment(id, 'invoiceId')}/${action}`,
    { auth: true, method: 'PATCH', body: jsonBody(payload), signal },
    fallbackMessage,
  )

  return unwrapEntity(response, 'invoice')
}

export const payInvoice = (id, payload = {}, signal) =>
  runInvoiceAction(id, 'pay', payload, signal, 'Không thể thanh toán hóa đơn.')

export const finalizeInvoice = (id, payload = {}, signal) =>
  runInvoiceAction(id, 'finalize', payload, signal, 'Không thể chốt hóa đơn.')

export const cancelInvoice = (id, payload = {}, signal) =>
  runInvoiceAction(id, 'cancel', payload, signal, 'Không thể hủy hóa đơn.')

export const refundInvoice = (id, payload = {}, signal) =>
  runInvoiceAction(id, 'refund', payload, signal, 'Không thể hoàn tiền hóa đơn.')
