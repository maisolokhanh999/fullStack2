import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import AdminDashboardPage from '../pages/AdminDashboardPage.jsx'
import DashboardPage from '../pages/DashboardPage.jsx'
import BookingPage from '../pages/BookingPage.jsx'
import BookingsPage from '../pages/BookingsPage.jsx'
import DishDetailPage from '../pages/DishDetailPage.jsx'
import LoginPage from '../pages/LoginPage.jsx'
import NotFoundPage from '../pages/NotFoundPage.jsx'
import RegisterPage from '../pages/RegisterPage.jsx'
import RestaurantDetailPage from '../pages/RestaurantDetailPage.jsx'
import RestaurantsPage from '../pages/RestaurantsPage.jsx'
import StaffCheckInPage from '../pages/StaffCheckInPage.jsx'
import CustomerLayout from '../components/customer/CustomerLayout.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { getLandingPath } from '../utils/roleNavigation.js'
import ProtectedRoute from './ProtectedRoute.jsx'
import RoleRoute from './RoleRoute.jsx'

// Dev-only tool: kept out of production builds entirely (route + bundled code),
// vì trang này cho gọi mọi endpoint và chứa credential mẫu.
const ApiTesterPage = import.meta.env.DEV
  ? lazy(() => import('../pages/ApiTesterPage.jsx'))
  : null

function RootRoute() {
  const { user, isLoading, sessionExpired } = useAuth()

  if (isLoading) {
    return (
      <div className="session-loading" role="status" aria-live="polite">
        <span className="spinner" aria-hidden="true" />
        <p>Đang kiểm tra phiên đăng nhập...</p>
      </div>
    )
  }

  return (
    <Navigate
      to={user ? getLandingPath(user) : '/login'}
      replace
      state={!user && sessionExpired ? { sessionExpired: true } : undefined}
    />
  )
}

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<RootRoute />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      {ApiTesterPage && (
        <Route
          path="/api-tester"
          element={(
            <Suspense fallback={null}>
              <ApiTesterPage />
            </Suspense>
          )}
        />
      )}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route element={<CustomerLayout />}>
          <Route path="/restaurants" element={<RestaurantsPage />} />
          <Route path="/restaurants/:restaurantId" element={<RestaurantDetailPage />} />
          <Route path="/restaurants/:restaurantId/dishes/:dishId" element={<DishDetailPage />} />
          <Route path="/booking/:restaurantId" element={<BookingPage />} />
          <Route path="/bookings" element={<BookingsPage />} />
        </Route>
        <Route element={<RoleRoute allowedRoles={['staff', 'admin']} />}>
          <Route path="/staff/check-in" element={<StaffCheckInPage />} />
        </Route>
        <Route element={<RoleRoute allowedRoles={['admin']} />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default AppRouter
