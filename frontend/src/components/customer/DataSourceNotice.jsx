function DataSourceNotice() {
  return (
    <div className="data-source-notice" role="status">
      <span aria-hidden="true">i</span>
      <p>
        Hiện hệ thống dùng hồ sơ mặc định của <strong>Bàn Việt</strong> trong khi chờ API
        thông tin nhà hàng. Thực đơn bên dưới được tải trực tiếp từ backend.
      </p>
    </div>
  )
}

export default DataSourceNotice
