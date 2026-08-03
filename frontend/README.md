# Bàn Việt Frontend

Frontend React + Vite cho ứng dụng đặt bàn và vận hành nhà hàng.

## Chạy local

```bash
npm install
npm run dev
```

API mặc định là `https://fullstack2-sdtf.onrender.com`. Có thể đổi bằng file `.env`:

```env
VITE_API_BASE_URL=https://example-api.com
```

## Cấu trúc điều hướng

- `/login`: đăng nhập.
- `/register`: tạo tài khoản khách hàng.
- `/dashboard`: trang tài khoản được bảo vệ bởi token.
- Route không tồn tại hiển thị trang 404.

Mã nguồn được tách theo `pages/`, `routes/`, `components/`, `services/` và `utils/`.

## Build và kiểm tra

```bash
npm run lint
npm run build
```

## Deploy frontend trên Render

Ứng dụng dùng `BrowserRouter`. Khi tạo Render Static Site, cần thêm Rewrite Rule:

- Source: `/*`
- Destination: `/index.html`

Rule này giúp mở trực tiếp hoặc refresh `/login`, `/register` và `/dashboard` mà không bị 404.
