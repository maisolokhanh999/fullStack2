import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import AuthContext from './authContextStore.js'
import { getMe } from '../services/authService.js'
import {
  clearStoredSession,
  getStoredToken,
  saveSession,
  updateStoredUser,
} from '../utils/authStorage.js'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [verificationError, setVerificationError] = useState('')
  const [sessionExpired, setSessionExpired] = useState(false)
  const [verificationAttempt, setVerificationAttempt] = useState(0)
  const verificationController = useRef(null)

  useEffect(() => {
    const token = getStoredToken()

    if (!token) {
      setUser(null)
      setIsLoading(false)
      setVerificationError('')
      return undefined
    }

    verificationController.current?.abort()
    const controller = new AbortController()
    verificationController.current = controller

    const verifyStoredSession = async () => {
      setIsLoading(true)
      setVerificationError('')

      try {
        const data = await getMe(token, controller.signal)
        if (controller.signal.aborted) return

        setUser(data.user)
        updateStoredUser(data.user)
        setSessionExpired(false)
      } catch (error) {
        if (error.name === 'AbortError') return

        setUser(null)

        if (error.status === 401 || error.status === 403) {
          clearStoredSession()
          setSessionExpired(true)
        } else {
          setVerificationError(error.message)
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    verifyStoredSession()
    return () => {
      controller.abort()
      if (verificationController.current === controller) {
        verificationController.current = null
      }
    }
  }, [verificationAttempt])

  const startSession = useCallback(({ token, user: authenticatedUser, remember = true }) => {
    verificationController.current?.abort()
    saveSession({ token, user: authenticatedUser, remember })
    setUser(authenticatedUser)
    setIsLoading(false)
    setVerificationError('')
    setSessionExpired(false)
  }, [])

  const endSession = useCallback(() => {
    verificationController.current?.abort()
    clearStoredSession()
    setUser(null)
    setIsLoading(false)
    setVerificationError('')
    setSessionExpired(false)
  }, [])

  const retryVerification = useCallback(() => {
    setIsLoading(true)
    setVerificationAttempt((current) => current + 1)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      verificationError,
      sessionExpired,
      startSession,
      endSession,
      retryVerification,
    }),
    [
      user,
      isLoading,
      verificationError,
      sessionExpired,
      startSession,
      endSession,
      retryVerification,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
