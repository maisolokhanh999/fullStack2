import mongoose from "mongoose";
import Reservation from "../model/reservation.js";
import Invoice from "../model/invoice.js";
import InvoiceDetail from "../model/invoiceDetail.js";
import Dish from "../model/dish.js";
import Table from "../model/table.js";
import ReservationTable from "../model/reservationTable.js";

export const reject = (message, status = 400) => { throw Object.assign(new Error(message), { status }); };
export const paidDeposit = (invoice) => invoice.depositPaymentStatus === "Succeeded" && !invoice.depositRefunded ? Number(invoice.depositAmount) || 0 : 0;
export const amountDue = (invoice) => Math.max(0, Math.round(Number(invoice.totalAmount) - (Number(invoice.discountAmount) || 0) - paidDeposit(invoice)));

export async function bookReservation(user, payload) {
  const guests = Number(payload.numberOfGuests);
  const visit = new Date(payload.expectedCheckInTime);
  if (!Number.isInteger(guests) || guests < 1 || guests > 20) reject("Số khách phải là số nguyên từ 1 đến 20");
  if (!Number.isFinite(visit.getTime()) || visit <= new Date()) reject("Giờ hẹn phải nằm trong tương lai");
  const restaurantTime = new Date(visit.getTime() + 7 * 60 * 60 * 1000);
  const minutes = restaurantTime.getUTCHours() * 60 + restaurantTime.getUTCMinutes();
  if (minutes < 600 || minutes > 1290 || minutes % 30 !== 0 || visit.getUTCSeconds() || visit.getUTCMilliseconds()) reject("Chọn giờ hẹn từ 10:00 đến 21:30, cách nhau 30 phút");
  if (typeof payload.customerName !== "string" || !payload.customerName.trim()) reject("Vui lòng nhập tên khách");
  if (!/^\d{9,10}$/.test(String(payload.customerPhone))) reject("Số điện thoại không hợp lệ");
  if (!Array.isArray(payload.preorderItems ?? [])) reject("Danh sách món không hợp lệ");
  const items = payload.preorderItems || [];
  if (items.length > 100) reject("Chỉ được chọn tối đa 100 món");
  const ids = new Set();
  for (const item of items) {
    if (!item || !mongoose.isValidObjectId(item.dishId) || ids.has(String(item.dishId))) reject("Món ăn không hợp lệ hoặc bị trùng");
    ids.add(String(item.dishId));
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20) reject("Số lượng món phải từ 1 đến 20");
  }
  if (payload.tableId && !mongoose.isValidObjectId(payload.tableId)) reject("Bàn không hợp lệ");

  return mongoose.connection.transaction(async (session) => {
    const dishes = await Dish.find({ _id: { $in: [...ids] } }).session(session);
    const dishMap = new Map(dishes.map((dish) => [String(dish._id), dish]));
    const details = items.map((item) => {
      const dish = dishMap.get(String(item.dishId));
      if (!dish || dish.status !== "Available" || dish.stock < item.quantity) reject("Món đã hết hoặc số lượng vượt tồn kho");
      return { dishId: dish._id, itemName: dish.name, unitPrice: dish.price, discount: dish.discount || 0, quantity: item.quantity, totalAmount: Math.round(dish.price * item.quantity * (1 - (dish.discount || 0) / 100)) };
    });
    const totalAmount = details.reduce((sum, item) => sum + item.totalAmount, 0);
    const depositAmount = Math.round(Math.max(totalAmount, guests * 100000) * 0.2);
    let table;
    if (payload.tableId) {
      table = await Table.findOneAndUpdate({ _id: payload.tableId, status: "Available", capacity: { $gte: guests } }, { status: "Reserved" }, { returnDocument: 'after', session });
      if (!table) reject("Bàn không còn khả dụng hoặc không đủ chỗ", 409);
    }
    const [reservation] = await Reservation.create([{
      customerName: payload.customerName.trim(), customerPhone: String(payload.customerPhone),
      bookedBy: user._id, numberOfGuests: guests, expectedCheckInTime: visit,
      reservationType: payload.reservationType || "Online", note: payload.note,
      depositAmount,
    }], { session });
    const [invoice] = await Invoice.create([{
      reservationId: reservation._id, userId: user._id, payerName: reservation.customerName,
      phoneNumber: reservation.customerPhone, totalAmount, depositAmount, finalAmount: totalAmount,
      depositPaymentStatus: "Pending", paymentMethod: "BankTransfer", status: "Pending", paymentDate: null,
    }], { session });
    if (details.length) await InvoiceDetail.insertMany(details.map((item) => ({ ...item, invoiceId: invoice._id })), { session });
    if (table) await ReservationTable.create([{ reservationId: reservation._id, tableId: table._id }], { session });
    return { reservation, invoice };
  });
}
