import { useState } from 'react'
import { getDishImage } from '../../utils/booking.js'

function DishVisual({ dish, compact = false }) {
  const [failedImage, setFailedImage] = useState('')
  const image = getDishImage(dish)
  const initial = String(dish?.name || 'B').trim().charAt(0).toUpperCase()

  return (
    <div className={'dish-visual' + (compact ? ' dish-visual--compact' : '')} aria-hidden="true">
      {image && image !== failedImage ? (
        <img src={image} alt="" loading="lazy" decoding="async" onError={() => setFailedImage(image)} />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  )
}

export default DishVisual
