import mongoose from 'mongoose';
import Reservation from '../model/reservation.js';
import ReservationTable from '../model/reservationTable.js';
import Table from '../model/table.js';
import Invoice from '../model/invoice.js';
import { reject } from './bookingService.js';

export async function transitionReservation(id, action, user, body = {}) {
  return mongoose.connection.transaction(async (session) => {
    const reservation = await Reservation.findById(id).session(session);
    if (!reservation) reject('Không tìm thấy đặt bàn', 404);
    if (action === 'cancel' && !['staff', 'admin'].includes(user?.role) && String(reservation.bookedBy) !== String(user?._id)) reject('Bạn không có quyền hủy lượt đặt bàn này', 403);
    const allowed = { confirm: ['Pending'], checkin: ['Pending', 'Confirmed'], complete: ['CheckedIn'], cancel: ['Pending', 'Confirmed'], 'no-show': ['Pending', 'Confirmed'], delete: ['Completed', 'Cancelled', 'NoShow'] };
    if (!allowed[action]?.includes(reservation.status)) reject(`Không thể thực hiện thao tác ở trạng thái ${reservation.status}`);
    if (action === 'complete') {
      const paid = await Invoice.exists({ reservationId: id, status: 'Paid' }).session(session);
      if (!paid) reject('Cần thanh toán hóa đơn trước khi hoàn tất lượt đặt bàn');
    }
    if (action === 'delete') {
      if (await Invoice.exists({ reservationId: id }).session(session)) reject('Lượt đặt có hóa đơn cần được giữ để đối soát');
      await ReservationTable.deleteMany({ reservationId: id }, { session });
      await reservation.deleteOne({ session });
      return { reservation, message: 'Xóa đặt bàn thành công' };
    }
    reservation.status = { confirm: 'Confirmed', checkin: 'CheckedIn', complete: 'Completed', cancel: 'Cancelled', 'no-show': 'NoShow' }[action];
    if (action === 'checkin') reservation.actualCheckInTime = new Date();
    let message = 'Cập nhật đặt bàn thành công';
    if (action === 'cancel') {
      reservation.cancellationReason = String(body.reason || 'Khách yêu cầu hủy').trim();
      reservation.cancelledAt = new Date();
      reservation.cancelledBy = user?._id;
      // Eligibility is not evidence that money was actually returned.
      reservation.depositRefunded = false;
      const eligible = new Date(reservation.expectedCheckInTime) - Date.now() >= 86400000;
      message = eligible ? 'Hủy đặt bàn thành công. Tiền cọc đủ điều kiện hoàn; vui lòng liên hệ nhà hàng để đối soát.' : 'Hủy đặt bàn thành công. Tiền cọc không đủ điều kiện hoàn theo chính sách.';
    }
    await reservation.save({ session });
    const tableIds = await ReservationTable.find({ reservationId: id, status: { $in: ['Active', 'Blocked'] } }).session(session).distinct('tableId');
    if (action === 'checkin') await Table.updateMany({ _id: { $in: tableIds } }, { status: 'Occupied' }, { session });
    if (['complete', 'cancel', 'no-show'].includes(action)) {
      await ReservationTable.updateMany({ reservationId: id, status: { $in: ['Active', 'Blocked'] } }, { status: 'Inactive' }, { session });
      await Table.updateMany({ _id: { $in: tableIds } }, { status: 'Available' }, { session });
    }
    if (['cancel', 'no-show'].includes(action)) {
      await Invoice.updateMany({ reservationId: id, status: { $in: ['Pending', 'Finalized'] } }, {
        $set: { status: 'Cancelled', cancellationReason: action === 'cancel' ? reservation.cancellationReason : 'Khách không đến', depositRefunded: false },
        $inc: { __v: 1 },
      }, { session });
    }
    return { reservation, message };
  });
}
