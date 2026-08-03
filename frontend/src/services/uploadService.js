import { apiRequest } from './apiClient.js'

export const uploadFile = (file, signal) => {
  if (!file) throw new TypeError('file is required')

  const formData = new FormData()
  formData.append('file', file)

  return apiRequest(
    '/upload',
    { auth: true, method: 'POST', body: formData, signal },
    'Không thể tải tệp lên.',
  )
}
