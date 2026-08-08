import { useState } from 'react'
import { getDishImage } from '../../utils/booking.js'

function DishVisual({ dish, compact = false }) {
  const [hasImageError, setHasImageError] = useState(false)
  const image = getDishImage(dish)
  const initial = String(dish?.name || 'B').trim().charAt(0).toUpperCase()

  return (
    <div className={'dish-visual' + (compact ? ' dish-visual--compact' : '')} aria-hidden="true">
      {image && !hasImageError ? (
        <img src={image} alt="" onError={() => setHasImageError(true)} />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  )
}

export default DishVisual
