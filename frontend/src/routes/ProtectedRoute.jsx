import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { getStoredToken } from '../utils/authStorage.js'

function ProtectedRoute() {
  const location = useLocation()

  if (!getStoredToken()) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

export default ProtectedRoute
