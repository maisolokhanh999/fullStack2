import { useNavigate } from 'react-router-dom'
import { useBookingDraft } from '../../context/bookingDraftStore.js'

export default function GatheringTable() {
  const { draft, updateInfo } = useBookingDraft()
  const navigate = useNavigate()
  const guests = Number(draft.guests) || 2
  const choose = (value) => updateInfo({ guests: Math.max(1, Math.min(20, value)) })
  return (
    <section className="bv-shell bv-gathering" id="gathering" aria-labelledby="gathering-title">
      <div><p className="bv-eyebrow">Có hẹn bên mâm cơm</p><h2 id="gathering-title" className="bv-display">Thêm một người.<br />Thêm một câu chuyện.</h2><p>Một cuộc gặp nhỏ hay cả nhà đông đủ, hãy bắt đầu bằng số người bạn muốn mời.</p><a href="#menu" className="bv-text-link">Chọn món cho buổi gặp ↗</a></div>
      <div className="bv-round-table">
        <svg viewBox="0 0 560 560" aria-hidden="true">
          <circle cx="280" cy="280" r="218" fill="#eeeadf" stroke="#d2bea0" />
          <circle cx="280" cy="280" r="272" fill="none" stroke="#e3dacf" />
          {Array.from({ length: guests }, (_, index) => {
            const angle = -Math.PI / 2 + index * Math.PI * 2 / guests
            return <g key={index} transform={`translate(${280 + 246 * Math.cos(angle)} ${280 + 246 * Math.sin(angle)}) rotate(${angle * 180 / Math.PI + 90})`}><circle r="13" fill="#c0a17b" /><circle r="8" fill="#fffdfa" /><path d="M20 -12v24m5-24v24" stroke="#a87547" strokeWidth="2" /></g>
          })}
        </svg>
        <div className="bv-round-table__controls"><span>Mấy người ăn?</span><div className="bv-round-table__count"><button type="button" aria-label="Bớt khách ở bàn tròn" disabled={guests === 1} onClick={() => choose(guests - 1)}>−</button><strong aria-live="polite">{guests}</strong><button type="button" aria-label="Thêm khách ở bàn tròn" disabled={guests === 20} onClick={() => choose(guests + 1)}>+</button></div><div className="bv-round-table__presets">{[2, 4, 6, 8].map((size) => <button type="button" key={size} aria-pressed={guests === size} onClick={() => choose(size)}>{size}</button>)}</div><p>{guests > 10 ? 'Nhóm đông người: chọn bàn đủ chỗ ở bước tiếp theo.' : 'Một mâm, ngồi quây quanh.'}</p><button type="button" className="bv-button" onClick={() => navigate('/booking/ban-viet')}>Giữ bàn cho {guests} người ↗</button></div>
      </div>
    </section>
  )
}
