import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { getLandingPath, normalizeRole } from '../utils/roleNavigation.js'

function RoleRoute({ allowedRoles }) {
  const { user } = useAuth()
  const role = normalizeRole(user?.role)

  if (!allowedRoles.map(normalizeRole).includes(role)) {
    return <Navigate to={getLandingPath(user)} replace />
  }

  return <Outlet />
}

export default RoleRoute
