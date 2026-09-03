export const normalizeRole = (role) => String(role || 'user').toLowerCase()

export const isStaffRole = (role) => ['staff', 'admin'].includes(normalizeRole(role))

export const isAdminRole = (role) => normalizeRole(role) === 'admin'

// Khu làm việc theo vai trò. Dùng cho nút "về khu của tôi" ở trang tài khoản và
// cho chỗ đá người vào nhầm route không đủ quyền — không phải đích sau đăng nhập.
export const getLandingPath = (user) => {
  if (isAdminRole(user?.role)) return '/admin'
  if (isStaffRole(user?.role)) return '/staff/check-in'
  return '/restaurants'
}

// Đăng nhập hay đăng ký trực tiếp: quản trị vào cổng quản trị, nhân viên vào
// khu check-in, còn khách hàng về trang chủ công khai.
export const getPostAuthLanding = (user) =>
  (isAdminRole(user?.role) ? '/admin' : isStaffRole(user?.role) ? '/staff/check-in' : '/')

const getInternalDestination = (from) => {
  if (!from) return null

  if (typeof from === 'string') {
    return from.startsWith('/') && !from.startsWith('//') ? from : null
  }

  const pathname = typeof from.pathname === 'string' ? from.pathname : ''
  if (!pathname.startsWith('/') || pathname.startsWith('//')) return null

  const search = typeof from.search === 'string' && from.search.startsWith('?')
    ? from.search
    : ''
  const hash = typeof from.hash === 'string' && from.hash.startsWith('#')
    ? from.hash
    : ''

  return `${pathname}${search}${hash}`
}

export const getPostAuthPath = (from, user) => {
  const fallback = getPostAuthLanding(user)
  const destination = getInternalDestination(from)

  if (!destination || ['/login', '/register', '/'].includes(destination)) {
    return fallback
  }

  const pathname = destination.split(/[?#]/, 1)[0]
  const requiresAdminRole = pathname === '/admin' || pathname.startsWith('/admin/')
  const requiresStaffRole = pathname === '/staff' || pathname.startsWith('/staff/')

  if (requiresAdminRole && !isAdminRole(user?.role)) return fallback
  if (requiresStaffRole && !isStaffRole(user?.role)) return fallback

  return destination
}
