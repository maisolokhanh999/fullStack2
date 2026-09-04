import { apiRequest } from './apiClient.js'
import { jsonBody, unwrapCollection, unwrapEntity, withQuery } from './serviceHelpers.js'

export async function createReview(payload, signal) {
  const response = await apiRequest(
    '/reviews',
    { auth: true, method: 'POST', body: jsonBody(payload), signal },
    'Không thể gửi đánh giá.',
  )
  return unwrapEntity(response, 'review')
}

export async function getReviews(query = {}, signal) {
  const response = await apiRequest(withQuery('/reviews', query), { signal }, 'Không thể tải đánh giá.')
  return unwrapCollection(response, 'reviews')
}