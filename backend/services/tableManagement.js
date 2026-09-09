import mongoose from 'mongoose';
import Table from '../model/table.js';
import ReservationTable from '../model/reservationTable.js';
import Reservation from '../model/reservation.js';
import { reject } from './bookingService.js';

export async function editTable(id, payload, remove = false) {
  return mongoose.connection.transaction(async (session) => {
    const table = await Table.findOneAndUpdate({ _id: id }, { $inc: { __v: 1 } }, { session, returnDocument: 'after' });
    if (!table) reject('Không tìm thấy bàn', 404);
    const assignment = await ReservationTable.findOne({ tableId: id, status: { $in: ['Active', 'Blocked'] } }).session(session);
    if (assignment) {
      if (remove || (payload.status && payload.status !== table.status)) reject('Bàn đang được gán. Hãy xử lý lượt đặt trước khi đổi trạng thái hoặc xóa bàn', 409);
      if (payload.capacity !== undefined) {
        const reservation = await Reservation.findById(assignment.reservationId).session(session);
        if (reservation && Number(payload.capacity) < reservation.numberOfGuests) reject('Sức chứa mới không đủ cho lượt đặt hiện tại');
      }
    }
    if (remove) await table.deleteOne({ session });
    else {
      for (const field of ['tableNumber', 'capacity', 'location', 'note', 'status']) {
        if (payload[field] !== undefined) table[field] = payload[field];
      }
      await table.save({ session });
    }
    return table;
  });
}

export async function editAssignment(id, action) {
  return mongoose.connection.transaction(async (session) => {
    const assignment = await ReservationTable.findById(id).session(session);
    if (!assignment) reject('Không tìm thấy bản ghi gán bàn', 404);
    if (action !== 'delete' && !['Active', 'Blocked'].includes(assignment.status)) reject('Bản ghi gán bàn đã kết thúc');
    if (['Active', 'Blocked'].includes(assignment.status)) {
      // Serialize with lifecycle changes and assignments to this reservation.
      await Reservation.findByIdAndUpdate(assignment.reservationId, { $inc: { __v: 1 } }, { session });
      if (action !== 'block') await Table.findByIdAndUpdate(assignment.tableId, { status: 'Available' }, { session });
    }
    if (action === 'delete') await assignment.deleteOne({ session });
    else { assignment.status = action === 'block' ? 'Blocked' : 'Inactive'; await assignment.save({ session }); }
    return assignment;
  });
}
