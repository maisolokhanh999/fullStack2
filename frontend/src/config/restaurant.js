export const DEFAULT_RESTAURANT = {
  id: 'ban-viet',
  name: 'Bàn Việt',
  eyebrow: 'Không gian Việt đương đại',
  description:
    'Một điểm đến ấm cúng cho những bữa ăn trọn vẹn, với thực đơn được tải trực tiếp từ hệ thống.',
  address: 'Địa chỉ nhà hàng đang chờ cập nhật từ hệ thống',
  hours: '10:00 – 22:00',
  minimumSpendPerGuest: 100000,
  depositRate: 0.2,
}

export const isDefaultRestaurant = (restaurantId) => restaurantId === DEFAULT_RESTAURANT.id
