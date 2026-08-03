import { apiRequest } from './apiClient.js'

export async function getDishes(signal) {
  const response = await apiRequest(
    '/dishes?limit=100',
    { signal },
    'Chưa thể tải thực đơn. Vui lòng thử lại.',
  )

  return {
    dishes: Array.isArray(response?.data) ? response.data : [],
    pagination: response?.pagination || null,
  }
}
