/**
 * Trả phần mô tả về đúng ô của nó.
 *
 * Form "Thêm món ăn" trước đây thiếu hẳn ô Mô tả, nên người nhập gõ cả đoạn
 * giới thiệu vào ô "Mã". Schema đặt `code: { uppercase: true }` nên Mongoose
 * viết hoa toàn bộ đoạn văn đó rồi cất vào cơ sở dữ liệu, còn ô `description`
 * thì rỗng. Kết quả: thực đơn hiện ra một lưới thẻ không có lấy một dòng mô
 * tả, và cột "Mã" trong cổng quản trị là những câu văn dài dằng dặc.
 *
 * Form đã được vá (commit 42706c2), nên món nhập từ đó về sau không dính nữa.
 * Script này dọn những bản ghi đã lỡ hỏng.
 *
 *   ADMIN_TOKEN=<token> node scripts/repairDishCodes.js --dry-run   # xem trước
 *   ADMIN_TOKEN=<token> node scripts/repairDishCodes.js             # ghi thật
 *
 * Lấy token: đăng nhập tài khoản admin trên web, mở DevTools › Console, gõ
 * `localStorage.token` rồi sao chép. Script không bao giờ chạm tới mật khẩu.
 *
 * Chạy lại bao nhiêu lần cũng được: món nào đã có mã ngắn gọn và mô tả đàng
 * hoàng thì bỏ qua.
 */

const API_BASE_URL = (process.env.API_BASE_URL || 'https://fullstack2-sdtf.onrender.com').replace(/\/+$/, '');
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
const DRY_RUN = process.argv.includes('--dry-run');

// Mã ngắn theo danh mục, nối tiếp lối đặt sẵn có của món Coca Cola: "DU001".
const CATEGORY_PREFIX = [
  [/khai vị/i, 'KV'],
  [/cơm|bún|mì|phở/i, 'CB'],
  [/canh|súp/i, 'CS'],
  [/nướng|bbq/i, 'NB'],
  [/lẩu/i, 'LA'],
  [/tráng miệng|bánh|chè/i, 'TM'],
  [/đồ uống|nước|cà phê|trà/i, 'DU'],
];

const prefixFor = (categoryName) => {
  for (const [pattern, prefix] of CATEGORY_PREFIX) {
    if (pattern.test(String(categoryName || ''))) return prefix;
  }
  return 'MA';
};

/* Chữ hoa do Mongoose ép, không phải do người nhập gõ hoa. Hạ về chữ thường
   rồi viết hoa đầu câu là đủ khôi phục — trừ vài danh từ riêng và chữ viết tắt
   phải nhặt lại bằng tay vì hạ chữ là mất hẳn. */
/* Không dùng \b quanh chữ có dấu: trong regex JS, "ỹ" không phải ký tự từ nên
   \b sau nó không bao giờ khớp — "kiểu mỹ" sẽ lọt lưới. */
const PROPER_NOUNS = [
  [/\bbbq\b/g, 'BBQ'],
  [/kiểu mỹ/g, 'kiểu Mỹ'],
  [/miền tây/g, 'miền Tây'],
];

/* Hai đoạn bị cụt mất chữ cái đầu ngay từ lúc nhập, không phải do việc chuyển
   ô này gây ra. Sửa luôn cho đỡ hiện chữ vô nghĩa lên thực đơn — đối chiếu với
   chính tên món thì đọc ra ngay. */
const TYPO_FIXES = [
  [/^á lóc đồng/, 'Cá lóc đồng'],
  [/^dắt mì chiên/, 'Vắt mì chiên'],
];

const toSentenceCase = (shouty) => {
  let text = String(shouty).trim().toLowerCase();
  for (const [pattern, replacement] of TYPO_FIXES) text = text.replace(pattern, replacement);
  for (const [pattern, replacement] of PROPER_NOUNS) text = text.replace(pattern, replacement);
  // Viết hoa chữ cái đầu mỗi câu.
  text = text.replace(/(^|[.!?]\s+)(\p{Ll})/gu, (_, lead, letter) => lead + letter.toUpperCase());
  return text;
};

// Mã thật thì ngắn và không có dấu cách; cả một câu văn nằm trong ô mã thì không.
const looksLikeProse = (code) => {
  const value = String(code || '').trim();
  return value.length > 12 || value.includes(' ');
};

const request = async (path, { method = 'GET', body } = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(ADMIN_TOKEN ? { Authorization: `Bearer ${ADMIN_TOKEN}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text.slice(0, 200) };
  }

  if (!response.ok) {
    const error = new Error(data.message || `${method} ${path} → HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return data;
};

const listOf = (payload, key) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.[key])) return payload.data[key];
  if (Array.isArray(payload?.[key])) return payload[key];
  return [];
};

const main = async () => {
  if (!ADMIN_TOKEN) {
    console.error('Thiếu ADMIN_TOKEN. Chạy: ADMIN_TOKEN=<token> node scripts/repairDishCodes.js');
    process.exitCode = 1;
    return;
  }

  console.log(`Máy chủ : ${API_BASE_URL}`);
  console.log(`Chế độ  : ${DRY_RUN ? 'XEM TRƯỚC (không ghi gì)' : 'GHI THẬT'}\n`);

  const dishes = listOf(await request('/dishes?limit=500'), 'dishes');
  const damaged = dishes.filter((dish) => looksLikeProse(dish.code) && !String(dish.description || '').trim());

  console.log(`Thực đơn có ${dishes.length} món, trong đó ${damaged.length} món cần dọn.\n`);
  if (damaged.length === 0) return;

  // Giữ chỗ những mã đang dùng để mã mới không đụng phải mã nào có sẵn.
  const usedCodes = new Set(
    dishes.filter((dish) => !looksLikeProse(dish.code)).map((dish) => String(dish.code).toUpperCase()),
  );
  const nextCode = (categoryName) => {
    const prefix = prefixFor(categoryName);
    for (let number = 1; number < 1000; number += 1) {
      const code = `${prefix}${String(number).padStart(3, '0')}`;
      if (!usedCodes.has(code)) {
        usedCodes.add(code);
        return code;
      }
    }
    throw new Error(`Hết số cho tiền tố ${prefix}`);
  };

  let repaired = 0;
  const failed = [];

  for (const dish of damaged) {
    const code = nextCode(dish.categoryId?.name);
    const description = toSentenceCase(dish.code);

    console.log(`${dish.name}`);
    console.log(`  mã      : ${code}   (thay cho một câu dài ${String(dish.code).length} ký tự)`);
    console.log(`  mô tả   : ${description}`);

    if (DRY_RUN) {
      console.log('  → xem trước, chưa ghi\n');
      continue;
    }

    try {
      await request(`/dishes/${dish._id}`, { method: 'PUT', body: { code, description } });
      repaired += 1;
      console.log('  → đã ghi\n');
    } catch (error) {
      failed.push({ name: dish.name, message: error.message });
      console.log(`  → HỎNG: ${error.message}\n`);
    }
  }

  if (DRY_RUN) {
    console.log(`Xem trước xong: ${damaged.length} món sẽ được dọn. Bỏ --dry-run để ghi thật.`);
    return;
  }

  console.log(`Đã dọn ${repaired}/${damaged.length} món.`);
  if (failed.length) {
    console.log('\nKhông ghi được:');
    for (const item of failed) console.log(`  · ${item.name}: ${item.message}`);
    process.exitCode = 1;
  }
};

main().catch((error) => {
  console.error(`Dừng giữa chừng: ${error.message}`);
  process.exitCode = 1;
});
