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

Base URL lấy từ `VITE_API_BASE_URL`, mặc định là `https://fullstack2-sdtf.onrender.com`. Các path dưới đây được nối trực tiếp vào base URL, **không thêm tiền tố `/api`**.

### API contract cho frontend

- Auth: `POST /auth/register`, `POST /auth/login`, `GET /auth/me`.
- Users: `GET /users`, `GET|PUT|DELETE /users/:id`, `PUT /users/:id/role`, `PUT /users/:id/password`.
- Categories: `GET|POST /categories`, `GET|PUT|DELETE /categories/:id`.
- Dishes: `GET|POST /dishes`, `GET|PUT|DELETE /dishes/:id`, `PATCH /dishes/:id/restore`.
- Menus: `GET|POST /menus`, `GET|PUT|DELETE /menus/:id`, `PATCH /menus/:id/restore`, `POST /menus/:id/items`, `DELETE /menus/:id/items/:dishId`, `PUT /menus/:id/items/reorder`.
- Tables: `GET|POST /tables`, `GET|PUT|DELETE /tables/:id`, `PATCH /tables/:id/status`.
- Reservations: `GET|POST /reservations`, `GET|PUT|DELETE /reservations/:id`, `PATCH /reservations/:id/confirm|checkin|complete|cancel|no-show`.
- Reservation Tables: `GET|POST /reservation-tables`, `GET|DELETE /reservation-tables/:id`, `GET /reservation-tables/reservations/:reservationId/tables`, `PATCH /reservation-tables/:id/release|block`.
- Invoices: `GET|POST /invoices`, `GET|PUT|DELETE /invoices/:id`, `PATCH /invoices/:id/pay|cancel|refund`.
- Invoice Details: `POST /invoice-details`, `POST /invoice-details/bulk`, `GET|PUT|DELETE /invoice-details/:id`.
- Upload: `POST /upload`.

### Phạm vi đã nối an toàn

Frontend hiện sử dụng API thật cho đăng ký, đăng nhập, xác thực phiên (`/auth`) và đọc danh sách món (`GET /dishes?limit=100`). Dữ liệu món hỗ trợ các trường `categoryId`, `code`, `name`, `type`, `description`, `servingUnit`, `price`, `discount`, `stock`, `image`, `status` và `isFeatured`.

### Luồng đang chờ backend xác nhận contract

Các luồng tạo/tra cứu lịch sử đặt bàn, tìm đặt bàn theo mã hoặc số điện thoại, cọc theo phần trăm, đặt món trước và nhân viên check-in vẫn được giới hạn theo khả năng backend. Danh sách endpoint mới chỉ xác định URL; backend chưa cung cấp/chạy ổn định DTO mutation, quy tắc chủ sở hữu và phân quyền, cách gắn bàn/món/cọc, cùng response thành công mẫu để frontend gửi dữ liệu mà không đoán sai.

Vì vậy frontend chỉ lưu bản nháp đặt bàn trong `sessionStorage`, không tạo mã đặt bàn, không báo thanh toán/check-in thành công giả. Khoản cọc 20% hiện chỉ là ước tính giao diện:

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
