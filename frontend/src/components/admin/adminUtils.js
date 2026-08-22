export const formatDateTime = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('vi-VN')
}

export const formatMoney = (value) => typeof value === 'number' ? `${value.toLocaleString('vi-VN')}đ` : '—'
