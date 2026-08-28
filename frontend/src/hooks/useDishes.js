import { useCallback, useEffect, useState } from 'react'
import { getDishById, getDishes } from '../services/dishService.js'

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

// Một món lẻ cho trang chi tiết. Tách khỏi useDishes vì trang chi tiết mở thẳng
// từ URL, không có sẵn danh sách để lấy ra.
export function useDish(dishId) {
  const [dish, setDish] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isMissing, setIsMissing] = useState(false)
  const [requestId, setRequestId] = useState(0)

  useEffect(() => {
    // URL thiếu id thì đây là trang không tồn tại, không phải lỗi tải.
    if (!dishId) {
      setDish(null)
      setError('')
      setIsMissing(true)
      setIsLoading(false)
      return undefined
    }

    const controller = new AbortController()

    const loadDish = async () => {
      try {
        setIsLoading(true)
        setError('')
        setIsMissing(false)
        setDish(await getDishById(dishId, controller.signal))
      } catch (requestError) {
        if (requestError.name !== 'AbortError') {
          setDish(null)
          // Món đã bị gỡ khỏi thực đơn là một trang không tồn tại, không phải
          // sự cố tải — mời bấm "Thử lại" ở đây chỉ tổ cho khách bấm hoài.
          setIsMissing(requestError.status === 404)
          setError(requestError.status === 404 ? '' : requestError.message)
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    loadDish()
    return () => controller.abort()
  }, [dishId, requestId])

  const retry = useCallback(() => setRequestId((value) => value + 1), [])

  return { dish, isLoading, error, isMissing, retry }
}
