# Bàn Việt Frontend

Frontend React + Vite cho ứng dụng đặt bàn và vận hành nhà hàng.

## Chạy local

    npm install
    npm run dev

API mặc định là https://fullstack2-sdtf.onrender.com. Có thể đổi bằng file .env:

    VITE_API_BASE_URL=https://example-api.com

## Điều hướng

### Tài khoản

- /login: đăng nhập.
- /register: tạo tài khoản khách hàng.
- /dashboard: thông tin tài khoản, được bảo vệ bằng token.

Sau khi đăng nhập hoặc đăng ký:

- user được chuyển tới /restaurants.
- staff và admin được chuyển tới /staff/check-in.

### Khách hàng

- /restaurants: danh sách nhà hàng. Hiện chỉ có một hồ sơ mặc định Bàn Việt vì backend chưa có API nhà hàng.
- /restaurants/:restaurantId: thông tin nhà hàng và thực đơn thật từ backend.
- /booking/:restaurantId: quy trình đặt bàn ba bước, chọn món là tùy chọn.
- /bookings: hiển thị bản nháp trên thiết bị; chưa giả lập lịch sử đặt bàn.

### Nhân viên

- /staff/check-in: giao diện tra cứu/check-in dành riêng cho staff và admin.

## Trạng thái tích hợp API

Đang sử dụng API thật:

- POST /auth/register
- POST /auth/login
- GET /auth/me
- GET /dishes?limit=100

Backend chưa có endpoint cho:

- danh sách/thông tin nhà hàng;
- kiểm tra bàn trống và tạo đặt bàn;
- thanh toán cọc;
- lịch sử đặt bàn;
- tra cứu và check-in khách.

Vì vậy frontend chỉ lưu bản nháp đặt bàn trong sessionStorage, không tạo mã đặt bàn, không báo thanh toán/check-in thành công giả. Khoản cọc 20% chỉ là ước tính:

    Mức tối thiểu = số khách × 100.000đ
    Cơ sở tính cọc = max(tổng món đặt trước, mức tối thiểu)
    Cọc dự kiến = cơ sở tính cọc × 20%

Backend phải xác nhận tỷ lệ, bàn còn trống và số tiền chính thức trước khi thanh toán.

## Cấu trúc

Mã nguồn được tách theo:

- pages/: các màn hình theo route;
- routes/: bảo vệ token và phân quyền;
- components/: giao diện dùng lại;
- context/: bản nháp đặt bàn với useReducer;
- services/: API client và service theo domain;
- styles/: CSS khách hàng, đặt bàn và nhân viên;
- utils/: lưu phiên, phân luồng vai trò và tính toán hiển thị.

## Build và kiểm tra

    npm run lint
    npm run build

## Deploy frontend trên Render

Ứng dụng dùng BrowserRouter. Khi tạo Render Static Site, cần thêm Rewrite Rule:

- Source: /*
- Destination: /index.html

Rule này giúp mở trực tiếp hoặc refresh các route mà không bị 404.
