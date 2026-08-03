export const encodePathSegment = (value, label = 'id') => {
  if (value === undefined || value === null || String(value).trim() === '') {
    throw new TypeError(`${label} is required`)
  }

  return encodeURIComponent(String(value))
}

const appendQueryValue = (searchParams, key, value) => {
  if (value === undefined || value === null || value === '') return

  if (Array.isArray(value)) {
    value.forEach((item) => appendQueryValue(searchParams, key, item))
    return
  }

  searchParams.append(key, value instanceof Date ? value.toISOString() : String(value))
}

export const withQuery = (path, query = {}) => {
  const searchParams = new URLSearchParams()

  Object.entries(query).forEach(([key, value]) => {
    appendQueryValue(searchParams, key, value)
  })

  const queryString = searchParams.toString()
  return queryString ? `${path}?${queryString}` : path
}

const throwForExplicitFailure = (response) => {
  if (response?.success !== false) return

  const error = new Error(response.message || 'Backend reported an unsuccessful response')
  error.data = response
  throw error
}

export const unwrapEntity = (response, preferredKey) => {
  throwForExplicitFailure(response)

  if (preferredKey && response?.data?.[preferredKey] !== undefined) {
    return response.data[preferredKey]
  }
  if (response?.data !== undefined) return response.data
  if (preferredKey && response?.[preferredKey] !== undefined) return response[preferredKey]
  return response
}

export const unwrapCollection = (response, key) => {
  throwForExplicitFailure(response)

  let items

  if (Array.isArray(response)) {
    items = response
  } else if (Array.isArray(response?.data)) {
    items = response.data
  } else if (Array.isArray(response?.data?.[key])) {
    items = response.data[key]
  } else if (Array.isArray(response?.data?.items)) {
    items = response.data.items
  } else if (Array.isArray(response?.[key])) {
    items = response[key]
  } else {
    items = []
  }

  return {
    [key]: items,
    pagination: response?.pagination ?? response?.data?.pagination ?? null,
  }
}

export const jsonBody = (payload) => JSON.stringify(payload ?? {})

export const isAbortSignal = (value) =>
  Boolean(
    value &&
      typeof value === 'object' &&
      typeof value.aborted === 'boolean' &&
      typeof value.addEventListener === 'function',
  )
