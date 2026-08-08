import UiIcon from '../UiIcon.jsx'

function DataSourceNotice() {
  return (
    <div className="data-source-notice" role="status">
      <span><UiIcon name="info" /></span>
      <p>
        Thông tin chi nhánh đang được cập nhật. Thực đơn bên dưới được đồng bộ trực tiếp
        từ hệ thống nhà hàng.
      </p>
    </div>
  )
}

export default DataSourceNotice
