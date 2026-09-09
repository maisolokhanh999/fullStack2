# Bàn Việt frontend

React + Vite. Trang chủ dùng Tailwind CSS 4; các màn hình thực đơn, đặt bàn, nhân viên và quản trị dùng chung token trong src/styles/refresh.css.

## Chạy local

Trong frontend: npm.cmd ci rồi npm.cmd run dev.
Đặt VITE_API_BASE_URL trong frontend/.env trỏ tới backend cùng phiên bản, ví dụ http://localhost:5000. Không thêm /api vào URL.
Nếu không cấu hình, frontend dùng https://fullstack2-sdtf.onrender.com.

Backend mới phải có trước khi dùng luồng đặt bàn mới: POST /reservations nhận tableId và tạo lượt đặt, hóa đơn, món, gán bàn trong một transaction. Không triển khai riêng frontend này lên backend cũ.

## Điều hướng và chức năng

- /: trang chủ, gợi ý món từ API thật, chọn số khách.
- /login, /register, /dashboard: tài khoản.
- /restaurants: thực đơn; /restaurants/ban-viet/dishes/:dishId: chi tiết món.
- /booking/ban-viet: chọn ngày/giờ Việt Nam, bàn, món tùy chọn, gửi đặt bàn.
- /bookings: lịch sử thuộc tài khoản, hóa đơn, QR, bản nháp và đánh giá.
- /staff/check-in, /staff/payments: nhân viên tra cứu, check-in và thanh toán.
- /admin: quản trị dữ liệu và vận hành.

Đăng nhập trực tiếp: khách về /, nhân viên về /staff/check-in, admin về /admin. Nếu bị yêu cầu đăng nhập giữa luồng, ứng dụng trở lại trang đang mở.

Cọc = 20% × max(tổng món sau giảm giá, số khách × 100.000đ), do backend tính. Hóa đơn chỉ trừ khoản cọc đã được nhân viên xác nhận nhận đủ. QR chuyển khoản không phải bằng chứng thanh toán thành công.

## Kiểm tra

Cài dependencies ở cả backend và frontend trước. Chạy npm.cmd test tại backend một lần để chuẩn bị MongoDB kiểm thử, rồi tại frontend:

    npm.cmd run lint
    npm.cmd test
    npm.cmd run build
    npm.cmd audit

Playwright dùng Microsoft Edge cài sẵn, tự mở Vite ở 127.0.0.1:5178. Với Chromium: npx.cmd playwright install chromium; đặt PLAYWRIGHT_CHANNEL=chromium.

regressions.spec.js dùng response fixtures cô lập. fullstack.spec.js chạy frontend với Express controllers và MongoDB replica set tạm, kiểm tra từ đăng nhập đến thanh toán bằng dữ liệu kiểm thử. Không đọc .env backend, không gửi đặt bàn, email, SMS hoặc tiền thật. MongoDB binary có thể được tải ở lần chạy đầu; database tạm được dọn sau test.

## Render

Build command: npm ci && npm run build. Publish directory: dist. Cấu hình VITE_API_BASE_URL trỏ đúng backend mới và rewrite /* về /index.html để các route mở trực tiếp hoạt động.

Chi tiết thay đổi và giới hạn kiểm chứng: [FRONTEND_AUDIT.md](../FRONTEND_AUDIT.md).
Ảnh minh họa: src/assets/hero-meal.png; prompt và nguồn tạo: src/assets/hero-meal.prompt.md.
