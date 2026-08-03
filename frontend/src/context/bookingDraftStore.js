import { createContext, useContext } from 'react'

export const BookingDraftContext = createContext(null)

export function useBookingDraft() {
  const context = useContext(BookingDraftContext)
  if (!context) throw new Error('useBookingDraft must be used inside BookingDraftProvider')
  return context
}
