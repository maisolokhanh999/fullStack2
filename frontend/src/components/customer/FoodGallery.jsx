import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDishId, getDishImage, getDishDetailPath, getDishCategoryLabel } from '../../utils/booking.js'
import '../../styles/gallery.css'

const selection = ['BV50-012', 'BV50-018', 'BV50-003', 'BV50-037', 'BV50-028', 'BV50-045', 'BV50-011', 'BV50-046', 'BVDR-002', 'BV50-024']

function GalleryViewer({ items, initialIndex, origin, onClose }) {
  const [index, setIndex] = useState(initialIndex)
  const dialog = useRef(null)
  const largeImage = useRef(null)
  const dish = items[index]
  useEffect(() => {
    const element = dialog.current
    const previousOverflow = document.body.style.overflow
    if (!element.open) element.showModal()
    document.body.style.overflow = 'hidden'
    let animation
    const frame = requestAnimationFrame(() => {
      const image = largeImage.current
      if (!origin || !image || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      const target = image.getBoundingClientRect()
      animation = image.animate([
        { transformOrigin: 'top left', transform: `translate(${origin.left - target.left}px, ${origin.top - target.top}px) scale(${origin.width / target.width}, ${origin.height / target.height})`, opacity: .4 },
        { transformOrigin: 'top left', transform: 'none', opacity: 1 },
      ], { duration: 550, easing: 'cubic-bezier(.22,1,.36,1)' })
    })
    return () => {
      cancelAnimationFrame(frame)
      animation?.cancel()
      document.body.style.overflow = previousOverflow
    }
  }, [origin])
  const move = (offset) => setIndex(value => (value + offset + items.length) % items.length)
  return <dialog ref={dialog} className="bv-gallery-dialog" aria-labelledby="gallery-view-title"
    onClose={onClose} onClick={event => { if (event.target === event.currentTarget) onClose() }}
    onKeyDown={event => {
      if (event.key === 'ArrowRight') { event.preventDefault(); move(1) }
      if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1) }
    }}>
    <div className="bv-gallery-view">
      <button autoFocus className="bv-gallery-close" onClick={onClose} aria-label="Đóng ảnh">×</button>
      <img ref={largeImage} key={getDishId(dish)} className="bv-gallery-large" src={getDishImage(dish)} alt={dish.name} />
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

function OrbitGallery({ items, onOpen }) {
  const root = useRef(null)
  const ring = useRef(null)
  const [paused, setPaused] = useState(false)
  useEffect(() => {
    let visible = false
    const paint = () => {
      if (ring.current) ring.current.style.animationPlayState = visible && !document.hidden && !paused ? 'running' : 'paused'
    }
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; paint() })
    observer.observe(root.current)
    document.addEventListener('visibilitychange', paint)
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', paint) }
  }, [paused])
  return <div className="bv-orbit" ref={root}>
    <div className="bv-orbit-heading"><p className="bv-gallery-kicker">Một vòng hương vị</p><h3 className="bv-display">Quanh bàn, quanh vị Việt.</h3></div>
    <div className="bv-orbit-stage">
      <div className="bv-orbit-ring" ref={ring} style={{ '--count': items.length }}>
        {items.map((dish, index) => <button className="bv-orbit-card" key={getDishId(dish)} style={{ '--i': index }} aria-label={`Xem ảnh xoay ${dish.name}`} aria-haspopup="dialog" onClick={event => onOpen(index, event)}>
          <img src={getDishImage(dish)} alt={dish.name} loading="lazy" /><span>{dish.name}</span>
        </button>)}
      </div>
    </div>
    <button className="bv-orbit-toggle" aria-pressed={paused} onClick={() => setPaused(value => !value)}>{paused ? 'Tiếp tục xoay ↻' : 'Dừng vòng xoay Ⅱ'}</button>
  </div>
}

export default function FoodGallery({ dishes, isLoading, error, onRetry }) {
  const [opened, setOpened] = useState(null)
  const [failed, setFailed] = useState([])
  const [origin, setOrigin] = useState(null)
  const openImage = (index, event) => {
    setOrigin(event.currentTarget.querySelector('img')?.getBoundingClientRect())
    setOpened(index)
  }
  const candidates = dishes.filter(dish => getDishImage(dish) && !failed.includes(getDishImage(dish)))
  const chosen = selection.map(code => candidates.find(dish => dish.code === code)).filter(Boolean)
  const items = [...chosen, ...candidates.filter(dish => !chosen.includes(dish))].slice(0, 30)
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
        items.length ? <><OrbitGallery items={items.slice(0, 12)} onOpen={openImage} /><p className="bv-gallery-collection">Bộ sưu tập / {items.length} khung hình</p><div className="bv-gallery-rows">{Array.from({ length: Math.ceil(items.length / 5) }, (_, index) => items.slice(index * 5, index * 5 + 5)).map((row, rowIndex) =>
          <div className="bv-gallery-row" key={rowIndex}>{row.map((dish, index) =>
            <button className="bv-gallery-tile" key={getDishId(dish)} aria-label={`Xem ảnh ${dish.name}`} aria-haspopup="dialog"
              onClick={event => openImage(rowIndex * 5 + index, event)}>
              <img src={getDishImage(dish)} alt={dish.name} loading="lazy" decoding="async" onError={() => setFailed(value => [...value, getDishImage(dish)])} />
              <span className="bv-gallery-number">{String(rowIndex * 5 + index + 1).padStart(2, '0')}</span>
              <span className="bv-gallery-label"><small>{getDishCategoryLabel(dish)}</small><strong>{dish.name}</strong><span aria-hidden="true">↗</span></span>
            </button>)}</div>)}</div></> : <p>Bộ sưu tập đang được chuẩn bị. Mời bạn ghé xem thực đơn.</p>}
      <div className="bv-gallery-foot"><span>Những hương vị đáng để ngồi lại.</span><span>Ảnh minh họa · Bấm ảnh để khám phá</span></div>
    </div>
    {opened !== null && items[opened] && <GalleryViewer items={items} initialIndex={opened} origin={origin} onClose={() => setOpened(null)} />}
  </section>
}
