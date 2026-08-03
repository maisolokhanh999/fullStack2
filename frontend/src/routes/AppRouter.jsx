import { Navigate, Route, Routes } from 'react-router-dom'
import DashboardPage from '../pages/DashboardPage.jsx'
import LoginPage from '../pages/LoginPage.jsx'
import NotFoundPage from '../pages/NotFoundPage.jsx'
import RegisterPage from '../pages/RegisterPage.jsx'
import { getStoredToken } from '../utils/authStorage.js'
import ProtectedRoute from './ProtectedRoute.jsx'

function RootRoute() {
  return <Navigate to={getStoredToken() ? '/dashboard' : '/login'} replace />
}

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<RootRoute />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default AppRouter
