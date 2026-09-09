# Rà soát frontend và backend — 08/09/2026

Repo: D:/Projects/fullStack2, origin maisolokhanh999/fullStack2. Đã fast-forward tới 1c07ef0 và ghép lại thay đổi local. Chưa commit, push hoặc deploy. Không thay đổi .claude/ và frontend-backup-20260824-1520/.

## Các lỗi đã sửa

- Quyền truy cập: bảo vệ danh sách người dùng, lịch sử đặt bàn, chi tiết hóa đơn và gán bàn; khách chỉ đọc/sửa dữ liệu thuộc tài khoản. PUT đặt bàn chỉ cho sửa tên, điện thoại, ghi chú. Thao tác thanh toán/trạng thái bàn yêu cầu staff/admin.
- Tài khoản bị khóa không dùng được token cũ hoặc đăng nhập. Admin có thể cấp role staff. JWT_SECRET bắt buộc, bỏ khóa dự phòng cố định.
- Đặt bàn: validate giờ Việt Nam và món ăn; backend tính giá giảm/cọc; transaction tạo đặt bàn, hóa đơn, món và giữ bàn. Hai người chọn cùng bàn chỉ một người thành công. Lỗi giữa chừng rollback toàn bộ.
- Gán bàn cũ, đổi trạng thái đặt bàn và trả bàn chạy trong transaction. Không cho reset/xóa bàn đang có lượt đặt hoặc giảm sức chứa dưới số khách. Hủy và check-in đồng thời không làm sai trạng thái bàn.
- Tiền cọc: phân biệt dự kiến và đã nhận; chỉ trừ cọc Succeeded. Nhân viên có nút xác nhận sau đối soát. Chặn sửa giá trị cọc đã nhận, thanh toán trùng và QR không còn hợp lệ. Số dư hóa đơn chưa thanh toán cũ được tính lại khi đọc/thanh toán; giữ nguyên lịch sử Paid.
- Thêm/sửa/xóa món và tính lại tổng chạy chung transaction, tránh mất cập nhật khi thêm món đồng thời hoặc thêm món vào hóa đơn đã chốt. Kiểm tra số lượng nguyên, giới hạn/tồn kho, giảm giá; ghi giá theo món thực tế.
- Hủy đặt bàn không tự ghi đã hoàn tiền. Lượt đặt có hóa đơn được giữ để đối soát, không xóa rời lịch sử.
- Frontend: form quản trị reset đúng bản ghi; ngày, category ID, boolean và trạng thái mặc định đúng kiểu; khóa thao tác trong khi lưu.
- Frontend: tổng hóa đơn cập nhật sau sửa/xóa món, QR cũ được xóa, lỗi QR không che lịch sử. Chặn modal mở lại sau khi đóng và request cũ trả về.
- Frontend: bản nháp/giỏ hiển thị dữ liệu thật, loại món đã xóa, tải đủ phân trang, giữ số khách qua đăng nhập; giờ gửi có +07:00 và được kiểm tra lại trước khi submit.
- Dependency: cập nhật các bản vá tương thích do npm audit báo ở frontend/backend.

## Giao diện

Tailwind đã có trong dependencies nhưng bố cục cũ chủ yếu là CSS tự viết. Đã bật utility CSS và xây lại trang chủ: nền kem, màu đất nung/xanh olive, chữ rõ, ảnh mâm cơm minh họa, gợi ý món từ API thật. Đồng bộ màu/spacing/card ở các màn hình còn lại; kiểm tra desktop 1440px và mobile 390px. Ảnh hero giữ đúng tỷ lệ, không kéo dài trên mobile.

Ảnh từ built-in image_gen: frontend/src/assets/hero-meal.png. Prompt chính xác: frontend/src/assets/hero-meal.prompt.md. Ảnh chỉ minh họa, có ghi rõ trên trang.

## Bằng chứng kiểm tra

- backend: npm.cmd test — 18 kiểm thử API với MongoDB replica set tạm.
- frontend: npm.cmd test — 20 kiểm thử browser, gồm 1 luồng FE + API + DB thật trong môi trường kiểm thử tách biệt.
- frontend: npm.cmd run lint và npm.cmd run build thành công.
- npm audit: frontend và backend không còn advisory được công cụ báo tại thời điểm chạy.
- node --check: 52 file JavaScript backend hợp lệ; kiểm tra đường dẫn import tương đối không có lỗi chữ hoa/thường.
- Mở frontend local đọc thực đơn thật: món/giá/ảnh tải thành công; không có error/warn console ở lần kiểm tra trang chủ. Ảnh chụp lưu local trong frontend/visual-review/home-live.png (gitignored).

## Chạy và triển khai

1. Cài dependencies bằng npm.cmd ci ở backend và frontend.
2. Backend cần MongoDB replica set hoặc Atlas, MONGODB_URL và JWT_SECRET riêng. Không có fallback transaction cho MongoDB standalone; lỗi DB không được bỏ qua để tạo nửa đơn.
3. BANK_ID, BANK_ACCOUNT_NO, BANK_ACCOUNT_NAME dùng cho QR; thiếu cấu hình thì API trả 503 và UI hiển thị lỗi riêng. Chạy backend bằng npm.cmd run dev.
4. VITE_API_BASE_URL frontend phải trỏ backend cùng phiên bản, không thêm /api. Triển khai backend trước frontend, cấu hình SPA rewrite cho Render.
5. Đối soát các khoản cọc cũ với ngân hàng trước khi đánh dấu đã nhận. Không tự suy đoán rằng cọc cũ đã được thanh toán.

## Giới hạn còn phải kiểm chứng

Chưa deploy các thay đổi này lên Render; link public vẫn là phiên bản đã deploy trước. Không tạo đặt bàn hoặc giao dịch trên production để thử. Kiểm thử không chứng minh email/SMS, Stripe/webhook, nhận chuyển khoản hoặc hoàn tiền thực tế đã hoạt động; xác nhận tiền hiện là thao tác thủ công sau đối soát.

Mô hình bàn hiện khóa theo trạng thái toàn cục, chưa lập lịch nhiều lượt cùng bàn theo khung giờ. Tồn kho được kiểm tra khi chọn món nhưng chưa quản lý định mức nguyên liệu. Đây là phạm vi hiện có của ứng dụng. Các kiểm tra trên không phải cam kết không còn mọi bug hoặc thay thế kiểm thử với dữ liệu production.

## Bổ sung theo phản hồi giao diện — 09/09/2026

- Khôi phục bàn tròn chọn số khách (1–20, preset 2/4/6/8) dùng chung booking draft; danh mục dẫn tới bộ lọc thực đơn thật; mục /#stories có nội dung mở đọc được.
- Đồng bộ login/register/dashboard với nền kem, đỏ đất, olive; sửa header quản trị nhạt chữ, logo sidebar và bỏ gạch chân nav để dùng trạng thái pill.
- Thêm chuyển động khi cuộn/hover, chuyển vị trí bát khi thay số khách; hỗ trợ prefers-reduced-motion. Tham khảo nhịp chuyển động của https://thepkz.github.io/minthep-portfolio/index.html#about.
- Tái hiện lỗi Render khi thêm món: isFeatured gửi chuỗi rỗng làm Mongoose CastError. ResourceForm local khởi tạo boolean false. Test tạo món không chạm checkbox đã pass.
- Đã thêm trực tiếp qua UI quản trị Render: GOI001 Gỏi cuốn tôm thịt (65.000đ), KV001 Nem nướng Nha Trang (95.000đ), CR001 Chả giò hải sản (85.000đ, nổi bật). Giá/mô tả/tồn kho lấy từ seedMenu.js có sẵn. Chưa tải ảnh riêng cho ba món này.
- API GET và trang /restaurants production đều xác nhận 17 món, gồm cả ba món mới. Script seed có trong Git không tự chạy vào database khi deploy.
- Sửa tổng phân trang /dishes tính cả món xóa mềm; kiểm tra page/limit đầu vào. Sửa này cần deploy backend.
- Kiểm tra: 19/19 test backend; 34/34 browser tests và 1/1 test tạo món bổ sung; lint/build pass. Ảnh desktop/mobile trong frontend/visual-review/regressions-visual-layout-*.png (gitignored).
- Code/CSS vẫn ở local, chưa commit/push/deploy. Chỉ ba bản ghi món ăn đã được lưu trên Render. Không tạo booking/payment production.

## Hoàn thiện thực đơn và phát hành — 09/09/2026

Bổ sung ảnh minh họa có nguồn cho gỏi cuốn, nem nướng, chả giò, phục vụ từ backend/public/menu. Nguồn/giấy phép hiển thị tại /media/credits.html. MenuContent backfill khi backend khởi động chỉ điền ảnh/mô tả trống theo tên món; không tạo món, không đổi giá và không ghi đè nội dung đã chỉnh. Thêm 14 mô tả ngắn cho danh sách món cũ. Test backfill kiểm tra chạy lặp lại và bảo toàn nội dung/giá hiện có. Frontend hỗ trợ URL ảnh /media từ API server. Bộ kiểm tra: 20 backend + 35 browser, lint/build.

## Ảnh cho 50 món bổ sung — 09/09/2026

- Đủ 50 ảnh đã tìm theo từng món, kiểm tra bằng bảng ảnh; thay ảnh cơm có chữ quảng cáo và ảnh cá quá cận cảnh.
- Ảnh WebP nằm trong backend/public/menu/expansion, tổng khoảng 3,5 MB cho 50 ảnh; nguồn gốc đối chiếu tại backend/data/menu-photos-50.json và trang /media/credits.html.
- completeExpansionPhotos chỉ điền ảnh trống cho đúng cặp mã/tên món, bỏ qua món xóa mềm và ảnh đã tự chỉnh. Không đổi giá, tồn kho, mô tả hay số món.
- Kiểm thử backend 22/22 đạt; frontend lint/build đạt. Kiểm tra production được thực hiện sau khi push.
