export function RowActionError({ message }) {
  return message ? <p className="admin-row-error">{message}</p> : null
}

export function AdminPanelLoading({ label }) {
  return <div className="menu-state" role="status"><span className="spinner" aria-hidden="true" /><p>{label}</p></div>
}

export function AdminPanelError({ message, onRetry }) {
  return <div className="menu-state menu-state--error" role="alert"><strong>Chưa tải được dữ liệu</strong><p>{message}</p><button type="button" className="outline-action" onClick={onRetry}>Thử lại</button></div>
}

export function AdminPanelEmpty({ message }) {
  return <div className="menu-state"><p>{message}</p></div>
}
