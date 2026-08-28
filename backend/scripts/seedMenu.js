/**
 * Nạp thêm món vào thực đơn qua chính API mà cổng quản trị đang dùng, thay vì
 * ngồi gõ tay từng món trong form "Thêm món ăn".
 *
 *   ADMIN_TOKEN=<token> node scripts/seedMenu.js --dry-run   # xem trước, không ghi
 *   ADMIN_TOKEN=<token> node scripts/seedMenu.js             # ghi thật
 *
 * Lấy token: đăng nhập tài khoản admin trên web, mở DevTools › Application ›
 * Local Storage › khoá "token" rồi sao chép giá trị. Script không bao giờ chạm
 * tới mật khẩu.
 *
 * Chạy lại bao nhiêu lần cũng được: món nào đã có mã trong hệ thống thì bỏ qua,
 * danh mục nào đã tồn tại thì dùng lại.
 *
 * Ảnh lấy từ Wikimedia Commons (giấy phép tự do). Đây là ảnh dẫn từ máy chủ
 * ngoài — đủ tốt để có thực đơn xem được ngay, nhưng khi chạy thật nên tải ảnh
 * riêng của nhà hàng lên qua form "Thêm món ăn" (đã nối sẵn Cloudinary).
 */

const API_BASE_URL = (process.env.API_BASE_URL || 'https://fullstack2-sdtf.onrender.com').replace(/\/+$/, '');
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
const DRY_RUN = process.argv.includes('--dry-run');

const CATEGORIES = [
  { name: 'Khai vị', description: 'Món ăn nhẹ mở đầu bữa, dọn ra trước món chính.' },
  { name: 'Món chính', description: 'Món no bụng, phần ăn đầy đủ cho một người.' },
  { name: 'Đồ uống', description: 'Cà phê, trà, nước ép và bia phục vụ tại bàn.' },
  { name: 'Tráng miệng', description: 'Chè, bánh ngọt và thạch dùng cuối bữa.' },
];

const commons = (file, width) =>
  width
    ? `https://upload.wikimedia.org/wikipedia/commons/thumb/${file}/${width}px-${file.split('/').pop()}`
    : `https://upload.wikimedia.org/wikipedia/commons/${file}`;

// Món nào để image rỗng là do không tìm được ảnh đúng món trên Commons. Thẻ món
// sẽ hiện ô chữ cái đầu thay ảnh — vẫn gọn, và quản trị tải ảnh thật lên sau.
const DISHES = [
  // ── Khai vị ──────────────────────────────────────────────────────────────
  {
    code: 'GC01', name: 'Gỏi cuốn tôm thịt', category: 'Khai vị', type: 'SideDish',
    servingUnit: 'Phần', price: 65000, discount: 0, stock: 40, isFeatured: false,
    description: 'Bánh tráng mỏng cuốn tôm sú, thịt ba chỉ luộc, bún và rau thơm. Chấm tương đậu phộng rang xay tại bếp.',
    image: commons('f/f2/Goi_cuon_Phuongnhu.JPG', 960),
  },
  {
    code: 'CG01', name: 'Chả giò hải sản', category: 'Khai vị', type: 'SideDish',
    servingUnit: 'Cái', price: 85000, discount: 0, stock: 35, isFeatured: true,
    description: 'Nhân tôm, mực và thịt băm cuốn bánh tráng rế, chiên vàng giòn. Dọn kèm rau sống và nước mắm chua ngọt.',
    image: commons('b/ba/Ch%E1%BA%A3_gi%C3%B2_SG_%28nem_r%C3%A1n_gi%C3%B2n%29_%E1%BB%9F_qu%C3%A1n_b%C3%BAn_ri%C3%AAu_B%C3%A0_Ti_ng26th7n2023_%283%29.jpg', 960),
  },
  {
    code: 'NN01', name: 'Nem nướng Nha Trang', category: 'Khai vị', type: 'SideDish',
    servingUnit: 'Phần', price: 95000, discount: 0, stock: 25, isFeatured: false,
    description: 'Thịt heo quết nhuyễn nướng than, cuốn cùng bánh tráng, rau sống và đồ chua. Chấm tương xay đặc trưng xứ Trầm.',
    image: '',
  },
  {
    code: 'GNS01', name: 'Gỏi ngó sen tôm thịt', category: 'Khai vị', type: 'SideDish',
    servingUnit: 'Đĩa', price: 110000, discount: 0, stock: 20, isFeatured: false,
    description: 'Ngó sen giòn trộn tôm luộc, thịt ba chỉ, rau răm và đậu phộng. Vị chua ngọt nhẹ, ăn khai vị rất vừa miệng.',
    image: '',
  },
  {
    code: 'BB01', name: 'Bánh bèo Huế', category: 'Khai vị', type: 'SideDish',
    servingUnit: 'Phần', price: 55000, discount: 0, stock: 30, isFeatured: false,
    description: 'Từng chén bột gạo hấp mềm, phủ tôm chấy, tóp mỡ giòn và hành lá. Chan nước mắm ngọt pha loãng kiểu Huế.',
    image: commons('0/0d/B%C3%A1nh_b%C3%A8o_ch%C3%A9n.jpg', 960),
  },
  {
    code: 'BK01', name: 'Bánh khọt Vũng Tàu', category: 'Khai vị', type: 'SideDish',
    servingUnit: 'Đĩa', price: 75000, discount: 10, stock: 28, isFeatured: false,
    description: 'Bánh bột gạo đổ khuôn, nhân tôm tươi, ăn kèm rau sống và nước mắm chua ngọt. Vỏ giòn rìa, lòng mềm.',
    image: commons('b/ba/B%C3%A1nh_kh%E1%BB%8Dt_tr%C3%AAn_khu%C3%B4n.jpg', 960),
  },

  // ── Món chính ────────────────────────────────────────────────────────────
  {
    code: 'PHO01', name: 'Phở bò tái nạm gầu', category: 'Món chính', type: 'MainCourse',
    servingUnit: 'Tô', price: 145000, discount: 12, stock: 50, isFeatured: true,
    description: 'Nước dùng ninh 12 tiếng từ xương ống bò, thơm quế hồi và gừng nướng. Bánh phở tươi, tái mềm và nạm gầu béo vừa.',
    image: commons('4/45/Pho_Bo_by_Banh_%26_Mee_in_Kirkgate_Market.jpg', 960),
  },
  {
    code: 'PHO02', name: 'Phở gà ta', category: 'Món chính', type: 'MainCourse',
    servingUnit: 'Tô', price: 125000, discount: 0, stock: 45, isFeatured: false,
    description: 'Gà ta thả vườn luộc vừa chín tới, thịt chắc và ngọt. Nước dùng trong, rắc hành mùi cùng chút gừng thái chỉ.',
    image: commons('f/f3/Vietnamsk%C3%A1_ku%C5%99ec%C3%AD_pol%C3%A9vka_%E2%80%9Cph%E1%BB%9F_g%C3%A0%E2%80%9C_se_%C5%A1irok%C3%BDmi_r%C3%BD%C5%BEov%C3%BDmi_nudlemi_01.JPG', 960),
  },
  {
    code: 'BBH01', name: 'Bún bò Huế', category: 'Món chính', type: 'MainCourse',
    servingUnit: 'Tô', price: 130000, discount: 0, stock: 40, isFeatured: true,
    description: 'Nước dùng nấu sả và mắm ruốc, cay ấm đúng vị Huế. Có bắp bò, giò heo và chả cua, ăn kèm rau sống thái nhỏ.',
    image: commons('f/fa/Bun_Bo_Hue_1.jpg', 960),
  },
  {
    code: 'BCH01', name: 'Bún chả Hà Nội', category: 'Món chính', type: 'MainCourse',
    servingUnit: 'Phần', price: 140000, discount: 0, stock: 35, isFeatured: false,
    description: 'Thịt ba chỉ và chả viên nướng than hoa, thả trong bát nước mắm pha chua ngọt cùng đu đủ, cà rốt. Ăn kèm bún rối.',
    image: commons('6/6a/B%C3%BAn_ch%E1%BA%A3_H%C3%A0ng_M%C3%A0nh.jpg', 960),
  },
  {
    code: 'BRC01', name: 'Bún riêu cua đồng', category: 'Món chính', type: 'MainCourse',
    servingUnit: 'Tô', price: 110000, discount: 0, stock: 35, isFeatured: false,
    description: 'Riêu cua đồng giã tay, nước dùng chua nhẹ từ me và cà chua. Thêm đậu rán, huyết và chút mắm tôm nếu khách thích.',
    image: commons('f/f0/Bun_rieu.jpg', 960),
  },
  {
    code: 'MQ01', name: 'Mì Quảng gà', category: 'Món chính', type: 'MainCourse',
    servingUnit: 'Tô', price: 120000, discount: 0, stock: 30, isFeatured: false,
    description: 'Sợi mì vàng, nước nhưn sánh chan xăm xắp. Gà ta kho nghệ, rắc đậu phộng và bẻ bánh tráng mè giòn lên trên.',
    image: commons('5/57/M%C3%AC_Qu%E1%BA%A3ng%2C_Da_Nang%2C_Vietnam.jpg', 960),
  },
  {
    code: 'CL01', name: 'Cao lầu Hội An', category: 'Món chính', type: 'MainCourse',
    servingUnit: 'Tô', price: 115000, discount: 0, stock: 25, isFeatured: false,
    description: 'Sợi cao lầu dai đặc trưng, xá xíu thái lát, rau sống Trà Quế và những miếng cao lầu chiên giòn rắc trên mặt.',
    image: commons('1/1f/Cao_l%E1%BA%A7u_2.jpg'),
  },
  {
    code: 'HT01', name: 'Hủ tiếu Nam Vang', category: 'Món chính', type: 'MainCourse',
    servingUnit: 'Tô', price: 120000, discount: 0, stock: 30, isFeatured: false,
    description: 'Nước dùng ninh xương heo trong và ngọt, có tôm, thịt bằm và gan. Khách gọi được bản khô trộn nước sốt riêng.',
    image: commons('c/c9/Hu-Tieu-Kho-2008.jpg', 960),
  },
  {
    code: 'CT01', name: 'Cơm tấm sườn bì chả', category: 'Món chính', type: 'MainCourse',
    servingUnit: 'Đĩa', price: 135000, discount: 0, stock: 45, isFeatured: true,
    description: 'Cơm tấm nấu tơi, sườn cốt lết ướp mật ong nướng than, thêm bì trộn thính và chả trứng hấp. Chan mỡ hành.',
    image: commons('8/8e/Com-Tam-2008.jpg', 960),
  },
  {
    code: 'BM01', name: 'Bánh mì thịt nướng', category: 'Món chính', type: 'MainCourse',
    servingUnit: 'Cái', price: 45000, discount: 0, stock: 60, isFeatured: false,
    description: 'Vỏ bánh nướng lại cho giòn, kẹp thịt nướng, pate, đồ chua, dưa leo và rau mùi. Rưới nước sốt đậm vị.',
    image: commons('1/19/B%C3%A1nh_m%C3%AC.jpg', 960),
  },
  {
    code: 'BX01', name: 'Bánh xèo miền Tây', category: 'Món chính', type: 'MainCourse',
    servingUnit: 'Cái', price: 95000, discount: 0, stock: 30, isFeatured: false,
    description: 'Bánh đổ chảo gang, vỏ mỏng giòn màu nghệ, nhân tôm thịt và giá đỗ. Cuốn cải xanh chấm mắm chua ngọt.',
    image: commons('e/e5/B%C3%A1nh_x%C3%A8o_1.jpg', 960),
  },
  {
    code: 'CKT01', name: 'Cá kho tộ', category: 'Món chính', type: 'MainCourse',
    servingUnit: 'Phần', price: 165000, discount: 0, stock: 20, isFeatured: false,
    description: 'Cá lóc kho trong tộ đất với nước màu dừa, tiêu và ớt. Kho lửa nhỏ đến khi thịt cá săn, nước kho sánh mặn ngọt.',
    image: commons('b/b4/C%C3%A1_kho_t%E1%BB%99.JPG', 960),
  },
  {
    code: 'TKT01', name: 'Thịt kho tàu', category: 'Món chính', type: 'MainCourse',
    servingUnit: 'Phần', price: 145000, discount: 0, stock: 25, isFeatured: false,
    description: 'Thịt ba chỉ kho nước dừa xiêm cùng trứng vịt, mềm rục và bóng nước hàng. Ăn kèm dưa giá cho đỡ ngán.',
    image: commons('4/4d/Th%E1%BB%8Bt_kho_ch%E1%BB%89.jpg', 960),
  },
  {
    code: 'GN01', name: 'Gà nướng lá chanh', category: 'Món chính', type: 'MainCourse',
    servingUnit: 'Phần', price: 185000, discount: 8, stock: 18, isFeatured: false,
    description: 'Nửa con gà ta ướp muối ớt và lá chanh thái chỉ, nướng than đến khi da vàng giòn. Chấm muối tiêu chanh.',
    image: commons('2/21/Chicken_BBQ.jpg', 960),
  },
  {
    code: 'LM01', name: 'Lẩu mắm miền Tây', category: 'Món chính', type: 'MainCourse',
    servingUnit: 'Phần', price: 320000, discount: 0, stock: 12, isFeatured: false,
    description: 'Nước lẩu dậy mùi mắm cá linh, nấu cùng cà tím và sả. Dọn kèm mẹt rau đồng, cá basa, tôm và mực.',
    image: '',
  },
  {
    code: 'BLL01', name: 'Bò lúc lắc', category: 'Món chính', type: 'MainCourse',
    servingUnit: 'Đĩa', price: 195000, discount: 0, stock: 22, isFeatured: true,
    description: 'Thăn bò cắt quân cờ, áp chảo lửa lớn cho xém cạnh mà lòng còn hồng. Xóc cùng hành tây, ớt chuông, chấm muối tiêu chanh.',
    image: commons('d/de/Bo_Luc_Lac-_the_shaking_beef.jpg', 960),
  },

  // ── Đồ uống ──────────────────────────────────────────────────────────────
  {
    code: 'CF01', name: 'Cà phê sữa đá', category: 'Đồ uống', type: 'Drink',
    servingUnit: 'Ly', price: 39000, discount: 0, stock: 99, isFeatured: true,
    description: 'Robusta Đắk Lắk pha phin, rót lên sữa đặc rồi đánh cùng đá viên. Đậm, ngọt vừa, dậy mùi cà phê rang mộc.',
    image: commons('e/ec/Ca_Phe_Sua_Da.jpg', 960),
  },
  {
    code: 'CF02', name: 'Cà phê trứng', category: 'Đồ uống', type: 'Drink',
    servingUnit: 'Ly', price: 55000, discount: 0, stock: 60, isFeatured: false,
    description: 'Lòng đỏ trứng đánh bông cùng sữa đặc, phủ lên cà phê phin nóng. Uống khi lớp kem còn ấm là ngon nhất.',
    image: commons('5/54/Egg_Coffee_%286923068614%29.jpg', 960),
  },
  {
    code: 'TS01', name: 'Trà sen vàng', category: 'Đồ uống', type: 'Drink',
    servingUnit: 'Ly', price: 45000, discount: 0, stock: 70, isFeatured: false,
    description: 'Trà xanh ướp sen, thêm sữa và trân châu hạt sen. Vị thanh, hậu ngọt nhẹ, hợp dùng sau bữa nhiều đạm.',
    image: '',
  },
  {
    code: 'NM01', name: 'Nước mía tắc', category: 'Đồ uống', type: 'Drink',
    servingUnit: 'Ly', price: 30000, discount: 0, stock: 80, isFeatured: false,
    description: 'Mía ép tại quầy, vắt thêm tắc cho thơm và bớt gắt ngọt. Phục vụ lạnh, không thêm đường.',
    image: '',
  },
  {
    code: 'STB01', name: 'Sinh tố bơ', category: 'Đồ uống', type: 'Drink',
    servingUnit: 'Ly', price: 55000, discount: 0, stock: 50, isFeatured: false,
    description: 'Bơ sáp xay cùng sữa đặc và đá, đặc mịn như kem. Rưới thêm chút sữa lên mặt trước khi mang ra.',
    image: commons('9/93/Avocado%2C_milk%2C_condensed_milk_and_ice_smoothies_-_Amazing_Chef_food_processor.jpg', 960),
  },
  {
    code: 'BIA01', name: 'Bia Sài Gòn', category: 'Đồ uống', type: 'Drink',
    servingUnit: 'Chai', price: 35000, discount: 0, stock: 120, isFeatured: false,
    description: 'Bia lager Sài Gòn ướp lạnh, phục vụ theo chai kèm ly đá. Hợp với các món nướng và lẩu.',
    image: commons('6/63/Sai_Gon_lager_beer_green_label.jpg', 960),
  },

  // ── Tráng miệng ──────────────────────────────────────────────────────────
  {
    code: 'CHE01', name: 'Chè hạt sen long nhãn', category: 'Tráng miệng', type: 'Dessert',
    servingUnit: 'Bát', price: 45000, discount: 0, stock: 40, isFeatured: false,
    description: 'Hạt sen hầm mềm lồng trong cùi nhãn, chan nước đường phèn nấu loãng. Dùng lạnh, thanh mát và không gắt.',
    image: '',
  },
  {
    code: 'CHE02', name: 'Chè ba màu', category: 'Tráng miệng', type: 'Dessert',
    servingUnit: 'Ly', price: 40000, discount: 0, stock: 45, isFeatured: false,
    description: 'Đậu đỏ, đậu xanh và thạch lá dứa xếp ba tầng, chan nước cốt dừa béo cùng đá bào.',
    image: '',
  },
  {
    code: 'FL01', name: 'Bánh flan cà phê', category: 'Tráng miệng', type: 'Dessert',
    servingUnit: 'Cái', price: 35000, discount: 0, stock: 50, isFeatured: false,
    description: 'Flan hấp cách thuỷ mịn không rỗ, rưới caramel đắng nhẹ và một thìa cà phê phin đậm.',
    image: commons('7/76/Cr%C3%A8me_caramel_by_Baoothersks.jpg'),
  },
  {
    code: 'RC01', name: 'Rau câu dừa', category: 'Tráng miệng', type: 'Dessert',
    servingUnit: 'Miếng', price: 30000, discount: 0, stock: 55, isFeatured: false,
    description: 'Rau câu hai lớp: lớp nước cốt dừa béo và lớp lá dứa thơm, đổ trong trái dừa rồi cắt miếng.',
    image: '',
  },
];

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

const ensureCategories = async () => {
  const existing = listOf(await request('/categories'), 'categories');
  const byName = new Map(existing.map((item) => [String(item.name).trim(), item._id]));

  for (const category of CATEGORIES) {
    if (byName.has(category.name)) {
      console.log(`  · danh mục "${category.name}" đã có`);
      continue;
    }
    if (DRY_RUN) {
      console.log(`  + sẽ tạo danh mục "${category.name}"`);
      byName.set(category.name, `DRY-${category.name}`);
      continue;
    }
    const created = await request('/categories', { method: 'POST', body: category });
    const id = created?.data?._id ?? created?._id;
    byName.set(category.name, id);
    console.log(`  + đã tạo danh mục "${category.name}"`);
  }

  return byName;
};

const main = async () => {
  if (!ADMIN_TOKEN) {
    console.error('Thiếu ADMIN_TOKEN. Chạy: ADMIN_TOKEN=<token> node scripts/seedMenu.js');
    process.exitCode = 1;
    return;
  }

  console.log(`Máy chủ : ${API_BASE_URL}`);
  console.log(`Chế độ  : ${DRY_RUN ? 'XEM TRƯỚC (không ghi gì)' : 'GHI THẬT'}\n`);

  console.log('Danh mục:');
  const categoryIds = await ensureCategories();

  const existingDishes = listOf(await request('/dishes?limit=500'), 'dishes');
  const existingCodes = new Set(existingDishes.map((dish) => String(dish.code).toUpperCase()));
  console.log(`\nThực đơn hiện có ${existingDishes.length} món.\n`);

  let created = 0;
  let skipped = 0;
  const failed = [];

  for (const dish of DISHES) {
    if (existingCodes.has(dish.code.toUpperCase())) {
      skipped += 1;
      console.log(`  · bỏ qua ${dish.code.padEnd(6)} ${dish.name} (mã đã tồn tại)`);
      continue;
    }

    const payload = {
      categoryId: categoryIds.get(dish.category),
      code: dish.code,
      name: dish.name,
      type: dish.type,
      description: dish.description,
      servingUnit: dish.servingUnit,
      price: dish.price,
      discount: dish.discount,
      stock: dish.stock,
      image: dish.image,
      status: 'Available',
      isFeatured: dish.isFeatured,
    };

    if (DRY_RUN) {
      created += 1;
      console.log(`  + sẽ thêm ${dish.code.padEnd(6)} ${dish.name}${dish.image ? '' : '  (chưa có ảnh)'}`);
      continue;
    }

    try {
      await request('/dishes', { method: 'POST', body: payload });
      created += 1;
      console.log(`  + đã thêm ${dish.code.padEnd(6)} ${dish.name}${dish.image ? '' : '  (chưa có ảnh)'}`);
    } catch (error) {
      failed.push({ code: dish.code, name: dish.name, message: error.message });
      console.log(`  ! lỗi    ${dish.code.padEnd(6)} ${dish.name} — ${error.message}`);
    }
  }

  console.log(`\nXong. ${DRY_RUN ? 'Sẽ thêm' : 'Đã thêm'} ${created} món, bỏ qua ${skipped} món đã có.`);
  if (failed.length) {
    console.log(`${failed.length} món lỗi:`);
    for (const item of failed) console.log(`  ${item.code} ${item.name} — ${item.message}`);
    process.exitCode = 1;
  }
};

main().catch((error) => {
  console.error('\nDừng vì lỗi:', error.message);
  process.exitCode = 1;
});
