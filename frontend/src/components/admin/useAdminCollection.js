import { useCallback, useEffect, useState } from 'react'

export default function useAdminCollection(loader, key) {
  const [items, setItems] = useState([]); const [isLoading, setIsLoading] = useState(true); const [error, setError] = useState(''); const [requestId, setRequestId] = useState(0)
  // Mọi service đều có chữ ký (query, signal). Trước đây chỗ này truyền signal
  // vào ô query nên request không bao giờ bị huỷ khi đổi tab.
  useEffect(() => { const controller = new AbortController(); setIsLoading(true); loader({}, controller.signal).then((result) => setItems(result[key] || [])).catch((requestError) => { if (requestError.name !== 'AbortError') { setItems([]); setError(requestError.message) } }).finally(() => { if (!controller.signal.aborted) setIsLoading(false) }); return () => controller.abort() }, [loader, key, requestId])
  const retry = useCallback(() => { setError(''); setRequestId((value) => value + 1) }, [])
  return { items, setItems, isLoading, error, retry }
}
