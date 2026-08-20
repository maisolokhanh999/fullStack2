import './App.css'
import './styles/customer.css'
import './styles/booking.css'
import './styles/staff.css'
import './styles/admin.css'
import { AuthProvider } from './context/AuthContext.jsx'
import { BookingDraftProvider } from './context/BookingDraftContext.jsx'
import AppRouter from './routes/AppRouter.jsx'

function App() {
  return (
    <AuthProvider>
      <BookingDraftProvider>
        <AppRouter />
      </BookingDraftProvider>
    </AuthProvider>
  )
}

export default App
