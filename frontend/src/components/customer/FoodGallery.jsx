import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDishId, getDishImage, getDishDetailPath, getDishCategoryLabel } from '../../utils/booking.js'
import '../../styles/gallery.css'

const selection = ['BV50-012', 'BV50-018', 'BV50-003', 'BV50-037', 'BV50-028', 'BV50-045', 'BV50-011', 'BV50-046', 'BVDR-002', 'BV50-024']

function GalleryViewer({ items, initialIndex, onClose }) {
  const [index, setIndex] = useState(initialIndex)
  const dialog = useRef(null)
  const dish = items[index]
  useEffect(() => {
    const element = dialog.current
    const previousOverflow = document.body.style.overflow
    if (!element.open) element.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])
  const move = (offset) => setIndex(value => (value + offset + items.length) % items.length)
  return <dialog ref={dialog} className="bv-gallery-dialog" aria-labelledby="gallery-view-title"
    onClose={onClose} onClick={event => { if (event.target === event.currentTarget) onClose() }}
    onKeyDown={event => {
      if (event.key === 'ArrowRight') { event.preventDefault(); move(1) }
      if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1) }
    }}>
    <div className="bv-gallery-view">
      <button autoFocus className="bv-gallery-close" onClick={onClose} aria-label="Đóng ảnh">×</button>
      <img className="bv-gallery-large" src={getDishImage(dish)} alt={dish.name} />
      <div className="bv-gallery-caption" aria-live="polite">
        <p className="bv-gallery-kicker">{getDishCategoryLabel(dish)} · {index + 1} / {items.length}</p>
        <h3 id="gallery-view-title" className="bv-display">{dish.name}</h3>
        <p>{dish.description}</p>
        <Link to={getDishDetailPath(dish)} onClick={onClose}>Khám phá món này ↗</Link>
      </div>
      <div className="bv-gallery-controls">
        <button onClick={() => move(-1)} aria-label="Ảnh trước">←</button>
        <button onClick={() => move(1)} aria-label="Ảnh tiếp theo">→</button>
      </div>
    </div>
  </dialog>
}

export default function FoodGallery({ dishes, isLoading, error, onRetry }) {
  const [opened, setOpened] = useState(null)
  const [failed, setFailed] = useState([])
  const candidates = dishes.filter(dish => getDishImage(dish) && !failed.includes(getDishImage(dish)))
  const chosen = selection.map(code => candidates.find(dish => dish.code === code)).filter(Boolean)
  const items = [...chosen, ...candidates.filter(dish => !chosen.includes(dish))].slice(0, 10)
  return <section id="gallery" className="bv-gallery" aria-labelledby="gallery-title">
    <div className="bv-shell">
      <div className="bv-gallery-heading">
        <div><p className="bv-gallery-kicker">Sắc vị Bàn Việt / Bộ sưu tập</p>
          <h2 id="gallery-title" className="bv-display">Ngon từ cái nhìn<br /><em>đầu tiên.</em></h2></div>
        <div><p>Một chút giòn, một chút thơm.<br />Cả một miền hương vị trong từng khung hình.</p>
          <Link to="/restaurants">Tìm món hợp vị bạn ↗</Link></div>
      </div>
      {isLoading ? <p role="status">Đang chuẩn bị bộ sưu tập…</p> : error ?
        <div role="status"><p>Chưa thể tải bộ sưu tập.</p><button className="bv-button" onClick={onRetry}>Thử lại</button></div> :
        items.length ? <div className="bv-gallery-rows">{[items.slice(0, 5), items.slice(5)].filter(row => row.length).map((row, rowIndex) =>
          <div className="bv-gallery-row" key={rowIndex}>{row.map((dish, index) =>
            <button className="bv-gallery-tile" key={getDishId(dish)} aria-label={`Xem ảnh ${dish.name}`} aria-haspopup="dialog"
              onClick={() => setOpened(rowIndex * 5 + index)}>
              <img src={getDishImage(dish)} alt={dish.name} loading="lazy" decoding="async" onError={() => setFailed(value => [...value, getDishImage(dish)])} />
              <span className="bv-gallery-number">{String(rowIndex * 5 + index + 1).padStart(2, '0')}</span>
              <span className="bv-gallery-label"><small>{getDishCategoryLabel(dish)}</small><strong>{dish.name}</strong><span aria-hidden="true">↗</span></span>
            </button>)}</div>)}</div> : <p>Bộ sưu tập đang được chuẩn bị. Mời bạn ghé xem thực đơn.</p>}
      <div className="bv-gallery-foot"><span>Những hương vị đáng để ngồi lại.</span><span>Ảnh minh họa · Bấm ảnh để khám phá</span></div>
    </div>
    {opened !== null && items[opened] && <GalleryViewer items={items} initialIndex={opened} onClose={() => setOpened(null)} />}
  </section>
}
