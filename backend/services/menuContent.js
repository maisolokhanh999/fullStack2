import Dish from '../model/dish.js';

// Backfill only missing editorial fields on the existing menu. No inserts,
// price changes, or replacement of content edited by the restaurant.
export const menuDescriptions = {
  'Gỏi ngó sen tôm thịt': 'Ngó sen giòn trộn tôm, thịt ba chỉ và rau thơm, vị chua ngọt nhẹ nhàng.',
  'Mì xào giòn hải sản': 'Mì chiên giòn phủ sốt hải sản và rau củ nóng hổi, đậm đà từng miếng.',
  'Cơm sườn nướng mật ong': 'Sườn nướng thơm mật ong, dùng cùng cơm trắng, rau xanh và đồ chua.',
  'Cơm chiên hải sản': 'Cơm chiên tơi hạt cùng tôm, mực và rau củ, thơm ngon và vừa miệng.',
  'Súp gà ngô non': 'Thịt gà xé hòa cùng ngô non và nấm trong phần súp nóng, ngọt thanh.',
  'Canh chua cá lóc': 'Cá lóc nấu cùng cà chua, thơm và rau, nước canh chua thanh kiểu miền Tây.',
  'Tôm hùm nướng phô mai': 'Tôm hùm nướng phủ phô mai béo thơm, thịt tôm ngọt mềm dưới lớp vàng óng.',
  'Bạch tuộc nướng sa tế': 'Bạch tuộc ướp sa tế cay thơm, nướng vừa chín để giữ độ giòn ngọt.',
  'Sườn heo nướng BBQ': 'Sườn heo nướng mềm, áo sốt BBQ đậm vị và thơm mùi khói nướng.',
  'Lẩu gà ớt hiểm': 'Thịt gà nấu cùng ớt hiểm trong nước lẩu cay ấm, thích hợp cùng nhau chia sẻ.',
  'Lẩu Thái hải sản chua cay': 'Nước lẩu chua cay thơm sả, lá chanh, dùng cùng hải sản và rau tươi.',
  'Bánh Panna Cotta': 'Bánh kem sữa mềm mịn với sốt trái cây chua ngọt, nhẹ nhàng khép lại bữa ăn.',
  'Chè thái sầu riêng': 'Chè trái cây cùng nước cốt dừa béo dịu và sầu riêng thơm đặc trưng.',
  'Coca Cola': 'Nước ngọt có gas mát lạnh, dùng cùng món nướng hoặc món chiên.',
};
export const menuImages = {
  'Gỏi cuốn tôm thịt': '/media/menu/goi-cuon.jpg',
  'Nem nướng Nha Trang': '/media/menu/nem-nuong.jpg',
  'Chả giò hải sản': '/media/menu/cha-gio.jpg',
};
export async function completeMenuContent() {
  let modified = 0;
  for (const [field, entries] of Object.entries({ description: menuDescriptions, image: menuImages })) {
    for (const [name, value] of Object.entries(entries)) {
      const result = await Dish.updateOne({ name, isDeleted: false, $or: [{ [field]: { $exists: false } }, { [field]: null }, { [field]: /^\s*$/ }] }, { $set: { [field]: value } }, { runValidators: true });
      modified += result.modifiedCount;
    }
  }
  return modified;
}
