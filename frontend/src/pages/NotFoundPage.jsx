import { Link } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout.jsx'

function NotFoundPage() {
  return (
    <AuthLayout ariaLabel="Không tìm thấy trang" portalLabel="Lỗi 404">
      <div className="not-found-card">
        <span className="not-found-code">404</span>
        <h1>Không tìm thấy trang</h1>
        <p>Địa chỉ bạn vừa mở không tồn tại hoặc đã được chuyển sang nơi khác.</p>
        <Link className="primary-button link-button" to="/">
          Quay về trang chính
          <span className="button-arrow" aria-hidden="true">↗</span>
        </Link>
      </div>
    </AuthLayout>
  )
}

export default NotFoundPage
