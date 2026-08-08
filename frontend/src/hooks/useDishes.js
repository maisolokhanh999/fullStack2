import { useCallback, useEffect, useState } from 'react'
import { getDishes } from '../services/dishService.js'

export function useDishes() {
  const [dishes, setDishes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [requestId, setRequestId] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    const loadDishes = async () => {
      try {
        setIsLoading(true)
        setError('')
        const result = await getDishes(controller.signal)
        setDishes(result.dishes)
      } catch (requestError) {
        if (requestError.name !== 'AbortError') {
          setDishes([])
          setError(requestError.message)
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    loadDishes()
    return () => controller.abort()
  }, [requestId])

  const retry = useCallback(() => setRequestId((value) => value + 1), [])

  return { dishes, isLoading, error, retry }
}
