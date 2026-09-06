/**
 * Cách đặt mã món, dùng chung cho scripts/seedMenu.js và
 * scripts/repairDishCodes.js để cả thực đơn chỉ có một quy ước.
 *
 * Nối tiếp lối đặt của món duy nhất từng được nhập đúng — Coca Cola mang mã
 * "DU001": hai chữ cái theo danh mục, rồi ba chữ số.
 */

/* Xét theo thứ tự, mẫu nào khớp trước thì thắng — nên mẫu hẹp phải đứng trên
   mẫu rộng. Cái bẫy ở đây là tiếng Việt không có ranh giới từ cho regex: chuỗi
   "rán" nằm lọt trong chữ "T-rán-g" của "Tráng Miệng Lạnh & Bánh", nên nếu để
   mẫu chiên/rán lên trước thì cả mục tráng miệng nhận mã CR. */
const CATEGORY_PREFIX = [
  [/tráng miệng|chè|kem|bánh ngọt/i, 'TM'],
  [/khai vị/i, 'KV'],
  [/gỏi|nộm/i, 'GO'],
  [/chiên|rán/i, 'CR'],
  [/cơm|bún|mì|phở|hủ tiếu/i, 'CB'],
  [/canh|súp/i, 'CS'],
  [/nướng|bbq/i, 'NB'],
  [/lẩu/i, 'LA'],
  [/kho|rim|món mặn/i, 'MM'],
  [/kiểu âu/i, 'AU'],
  [/đồ uống|nước|cà phê|trà|bia/i, 'DU'],
];

export const prefixFor = (categoryName) => {
  for (const [pattern, prefix] of CATEGORY_PREFIX) {
    if (pattern.test(String(categoryName || ''))) return prefix;
  }
  return 'MA';
};

/**
 * Phát mã mới, tránh mọi mã đang dùng. Truyền vào danh sách mã hiện có để lần
 * chạy nào cũng nối tiếp chứ không giẫm lên số cũ.
 */
export const createCodeAllocator = (existingCodes = []) => {
  const used = new Set([...existingCodes].map((code) => String(code).toUpperCase()));

  return (categoryName) => {
    const prefix = prefixFor(categoryName);
    for (let number = 1; number < 1000; number += 1) {
      const code = `${prefix}${String(number).padStart(3, '0')}`;
      if (!used.has(code)) {
        used.add(code);
        return code;
      }
    }
    throw new Error(`Hết số cho tiền tố ${prefix}`);
  };
};
