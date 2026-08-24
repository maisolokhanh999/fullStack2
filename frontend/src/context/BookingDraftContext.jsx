import { useEffect, useMemo, useReducer } from 'react'
import { DEFAULT_RESTAURANT } from '../config/restaurant.js'
import { useAuth } from '../hooks/useAuth.js'
import {
  getDishId,
  getDishPrice,
  getDishQuantityLimit,
  isDishAvailable,
} from '../utils/booking.js'
import { BookingDraftContext } from './bookingDraftStore.js'

const STORAGE_PREFIX = 'ban-viet-booking-draft:'

const createInitialDraft = () => ({
  restaurantId: DEFAULT_RESTAURANT.id,
  visitDate: '',
  visitTime: '',
  guests: 2,
  tableId: '',
  note: '',
  items: [],
  updatedAt: '',
})

const normalizeText = (value, maxLength) =>
  (typeof value === 'string' ? value : '').slice(0, maxLength)

const normalizeGuests = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.min(20, Math.max(1, Math.round(parsed))) : 2
}

const normalizeItems = (items) => {
  if (!Array.isArray(items)) return []

  const uniqueItems = new Map()

  items.forEach((item) => {
    if (!item || typeof item !== 'object') return

    const dishId = normalizeText(item.dishId, 120).trim()
    const rawQuantity = Number(item.quantity)
    const quantity = Math.min(20, Math.max(1, Math.round(rawQuantity)))
    const price = Number(item.price)

    if (
      !dishId ||
      !Number.isFinite(rawQuantity) ||
      rawQuantity <= 0 ||
      !Number.isFinite(price) ||
      price < 0
    ) return

    uniqueItems.set(dishId, {
      dishId,
      name: normalizeText(item.name, 160).trim() || 'Món ăn',
      price,
      quantity,
      status: normalizeText(item.status, 40),
    })
  })

  return [...uniqueItems.values()]
}

const normalizeDraft = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return createInitialDraft()

  return {
    restaurantId: DEFAULT_RESTAURANT.id,
    visitDate: normalizeText(value.visitDate, 10),
    visitTime: normalizeText(value.visitTime, 5),
    guests: normalizeGuests(value.guests),
    tableId: normalizeText(value.tableId, 120).trim(),
    note: normalizeText(value.note, 300),
    items: normalizeItems(value.items),
    updatedAt: normalizeText(value.updatedAt, 40),
  }
}

const getUserIdentity = (user) => {
  const identity = user?._id || user?.id || user?.email
  return identity ? encodeURIComponent(String(identity).toLowerCase()) : ''
}

const readDraft = (storageKey) => {
  if (!storageKey) return createInitialDraft()

  try {
    const storedDraft = sessionStorage.getItem(storageKey)
    return storedDraft ? normalizeDraft(JSON.parse(storedDraft)) : createInitialDraft()
  } catch {
    return createInitialDraft()
  }
}

const draftChangedByDishes = (items, dishes) => {
  const dishMap = new Map(dishes.map((dish) => [getDishId(dish), dish]))
  const nextItems = []
  let changed = false

  items.forEach((item) => {
    const dish = dishMap.get(item.dishId)

    if (!dish) {
      nextItems.push(item)
      return
    }

    if (!isDishAvailable(dish)) {
      changed = true
      return
    }

    const nextItem = {
      ...item,
      name: normalizeText(dish.name, 160).trim() || item.name,
      price: getDishPrice(dish),
      quantity: Math.min(item.quantity, getDishQuantityLimit(dish)),
      status: normalizeText(dish.status, 40),
    }

    if (
      nextItem.name !== item.name ||
      nextItem.price !== item.price ||
      nextItem.quantity !== item.quantity ||
      nextItem.status !== item.status
    ) {
      changed = true
    }

    nextItems.push(nextItem)
  })

  return changed ? nextItems : null
}

function bookingDraftReducer(state, action) {
  switch (action.type) {
    case 'SWITCH_OWNER':
      return { storageKey: action.storageKey, draft: action.draft }
    case 'UPDATE_INFO': {
      // Payload có thể là một hàm nhận bản nháp hiện tại, để những thao tác
      // tăng/giảm liên tiếp không đọc phải giá trị cũ của lần render trước.
      const patch =
        typeof action.payload === 'function' ? action.payload(state.draft) : action.payload

      return {
        ...state,
        draft: {
          ...state.draft,
          ...patch,
          updatedAt: new Date().toISOString(),
        },
      }
    }
    case 'SET_ITEM_QUANTITY': {
      const { dish, quantity } = action.payload
      const dishId = getDishId(dish)
      if (!dishId) return state

      const nextItems = state.draft.items.filter((item) => item.dishId !== dishId)
      const nextQuantity = Math.min(
        getDishQuantityLimit(dish),
        Math.max(1, Math.round(Number(quantity) || 1)),
      )

      if (quantity > 0 && nextQuantity > 0) {
        nextItems.push({
          dishId,
          name: normalizeText(dish.name, 160).trim() || 'Món ăn',
          price: getDishPrice(dish),
          quantity: nextQuantity,
          status: normalizeText(dish.status, 40),
        })
      }

      return {
        ...state,
        draft: { ...state.draft, items: nextItems, updatedAt: new Date().toISOString() },
      }
    }
    case 'RECONCILE_ITEMS': {
      const nextItems = draftChangedByDishes(state.draft.items, action.dishes)
      if (!nextItems) return state

      return {
        ...state,
        draft: { ...state.draft, items: nextItems, updatedAt: new Date().toISOString() },
      }
    }
    case 'CLEAR_DRAFT':
      return { ...state, draft: createInitialDraft() }
    default:
      return state
  }
}

export function BookingDraftProvider({ children }) {
  const { user } = useAuth()
  const userIdentity = getUserIdentity(user)
  const storageKey = userIdentity ? `${STORAGE_PREFIX}${userIdentity}` : ''
  const [state, dispatch] = useReducer(bookingDraftReducer, {
    storageKey: '',
    draft: createInitialDraft(),
  })

  useEffect(() => {
    dispatch({
      type: 'SWITCH_OWNER',
      storageKey,
      draft: readDraft(storageKey),
    })
  }, [storageKey])

  useEffect(() => {
    if (!storageKey || state.storageKey !== storageKey) return

    try {
      sessionStorage.setItem(storageKey, JSON.stringify(state.draft))
    } catch {
      // The draft remains usable in memory when browser storage is unavailable.
    }
  }, [state, storageKey])

  const actions = useMemo(
    () => ({
      updateInfo: (payload) => dispatch({ type: 'UPDATE_INFO', payload }),
      setItemQuantity: (dish, quantity) =>
        dispatch({ type: 'SET_ITEM_QUANTITY', payload: { dish, quantity } }),
      reconcileItems: (dishes) => dispatch({ type: 'RECONCILE_ITEMS', dishes }),
      clearDraft: () => dispatch({ type: 'CLEAR_DRAFT' }),
    }),
    [],
  )

  const activeDraft = state.storageKey === storageKey ? state.draft : createInitialDraft()

  return (
    <BookingDraftContext.Provider value={{ draft: activeDraft, ...actions }}>
      {children}
    </BookingDraftContext.Provider>
  )
}
