export const formatDateTime = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('vi-VN')
}

export const formatMoney = (value) => typeof value === 'number' ? `${value.toLocaleString('vi-VN')}đ` : '—'

export const RESERVATION_STATUS_LABELS = {
  Pending: 'Chờ xác nhận',
  Confirmed: 'Đã xác nhận',
  CheckedIn: 'Đã check-in',
  Completed: 'Hoàn tất',
  Cancelled: 'Đã huỷ',
  NoShow: 'Không đến',
}

export const USER_STATUS_LABELS = {
  Active: 'Đang hoạt động',
  Inactive: 'Chưa kích hoạt',
  Blocked: 'Đã khóa',
}

export const INVOICE_STATUS_LABELS = {
  Pending: 'Chờ thanh toán',
  Finalized: 'Đã chốt',
  Paid: 'Đã thanh toán',
  Cancelled: 'Đã huỷ',
  Refunded: 'Đã hoàn tiền',
}

// Giữ nguyên giá trị gốc nếu backend trả về trạng thái chưa có trong bảng nhãn,
// để không che mất dữ liệu thật.
export const labelFor = (labels, status) => labels[status] || status || '—'
