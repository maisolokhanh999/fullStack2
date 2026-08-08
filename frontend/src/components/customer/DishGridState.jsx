function DishGridState({ isLoading, error, isEmpty, onRetry }) {
  if (isLoading) {
    return (
      <div className="menu-state" role="status">
        <span className="spinner" aria-hidden="true" />
        <p>Đang tải thực đơn từ nhà hàng...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="menu-state menu-state--error" role="alert">
        <strong>Chưa tải được thực đơn</strong>
        <p>{error}</p>
        <button type="button" className="outline-action" onClick={onRetry}>Thử lại</button>
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div className="menu-state">
        <strong>Thực đơn đang được cập nhật</strong>
        <p>Nhà hàng chưa có món ăn nào để hiển thị.</p>
      </div>
    )
  }

  return null
}

export default DishGridState
