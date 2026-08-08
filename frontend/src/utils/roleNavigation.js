export const normalizeRole = (role) => String(role || 'user').toLowerCase()

export const isStaffRole = (role) => ['staff', 'admin'].includes(normalizeRole(role))

export const getLandingPath = (user) =>
  isStaffRole(user?.role) ? '/staff/check-in' : '/restaurants'

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
  const fallback = getLandingPath(user)
  const destination = getInternalDestination(from)

  if (!destination || ['/login', '/register', '/'].includes(destination)) {
    return fallback
  }

  const pathname = destination.split(/[?#]/, 1)[0]
  const requiresStaffRole = pathname === '/staff' || pathname.startsWith('/staff/')

  if (requiresStaffRole && !isStaffRole(user?.role)) return fallback

  return destination
}
