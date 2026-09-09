import mongoose from 'mongoose';
import Invoice from '../model/invoice.js';
import InvoiceDetail from '../model/invoiceDetail.js';
import Dish from '../model/dish.js';
import Menu from '../model/menu.js';
import { amountDue, reject } from './bookingService.js';

const quantityOf = (value) => {
  const quantity = Number(value);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) reject('Số lượng phải là số nguyên từ 1 đến 99');
  return quantity;
};
const discountOf = (value) => {
  const discount = Number(value);
  if (!Number.isFinite(discount) || discount < 0 || discount > 100) reject('Giảm giá phải từ 0 đến 100');
  return discount;
};
const totalOf = (detail) => Math.round(detail.unitPrice * detail.quantity * (1 - detail.discount / 100));

export async function mutateInvoiceItems(operation, payload, detailId) {
  return mongoose.connection.transaction(async (session) => {
    const detail = detailId ? await InvoiceDetail.findById(detailId).session(session) : null;
    if (detailId && !detail) reject('Không tìm thấy chi tiết hóa đơn', 404);
    const invoiceId = detail?.invoiceId || payload.invoiceId;
    // Acquire the invoice before writing any item. Concurrent changes retry on
    // a fresh snapshot; a finalized invoice cannot receive a late item write.
    const invoice = await Invoice.findOneAndUpdate(
      { _id: invoiceId, status: 'Pending' }, { $inc: { __v: 1 } },
      { session, returnDocument: 'after' },
    );
    if (!invoice) {
      if (!await Invoice.exists({ _id: invoiceId }).session(session)) reject('Không tìm thấy hóa đơn', 404);
      reject('Chỉ có thể sửa món khi hóa đơn đang ở trạng thái Pending');
    }

    let result, status = 200;
    if (operation === 'delete') {
      await detail.deleteOne({ session });
    } else if (operation === 'update') {
      const quantity = quantityOf(payload.quantity ?? detail.quantity);
      if (detail.dishId && quantity > detail.quantity) {
        const dish = await Dish.findById(detail.dishId).session(session);
        if (!dish || dish.status !== 'Available' || dish.stock < quantity) reject('Món đã hết hoặc số lượng vượt tồn kho');
      }
      detail.quantity = quantity;
      detail.discount = discountOf(payload.discount ?? detail.discount);
      detail.totalAmount = totalOf(detail);
      if (payload.note !== undefined) detail.note = payload.note;
      result = await detail.save({ session });
    } else {
      const items = operation === 'bulk' ? payload.items : [payload];
      if (!Array.isArray(items) || !items.length || items.length > 100) reject('Danh sách món phải có từ 1 đến 100 món');
      const results = [];
      for (const item of items) {
        if (!item || (!item.dishId && !item.menuId)) reject('Vui lòng chọn món');
        const quantity = quantityOf(item.quantity);
        const dish = item.dishId ? await Dish.findById(item.dishId).session(session) : null;
        const menu = !item.dishId && item.menuId ? await Menu.findById(item.menuId).session(session) : null;
        if (!dish && !menu) reject('Không tìm thấy món ăn', 404);
        const source = dish || menu;
        if (!Number.isFinite(source.price) || source.price < 0) reject('Món ăn chưa có giá bán hợp lệ');
        const identity = dish ? { dishId: dish._id } : { menuId: menu._id };
        let existing = await InvoiceDetail.findOne({ invoiceId, ...identity }).session(session);
        const combined = quantityOf((existing?.quantity || 0) + quantity);
        if (dish && (dish.status !== 'Available' || dish.stock < combined)) reject('Món đã hết hoặc số lượng vượt tồn kho');
        const discount = discountOf(dish ? dish.discount : (item.discount ?? existing?.discount ?? 0));
        const fields = { invoiceId, ...identity, itemName: source.name, quantity: combined, unitPrice: source.price, discount };
        fields.totalAmount = totalOf(fields);
        if (item.note !== undefined) fields.note = item.note;
        if (existing) Object.assign(existing, fields);
        else { existing = new InvoiceDetail(fields); status = 201; }
        results.push(await existing.save({ session }));
      }
      result = operation === 'bulk' ? results : results[0];
    }

    const details = await InvoiceDetail.find({ invoiceId }).session(session);
    invoice.totalAmount = details.reduce((sum, row) => sum + row.totalAmount, 0);
    invoice.finalAmount = amountDue(invoice);
    invoice.changeAmount = invoice.paymentMethod === 'Cash' ? Math.max(0, (invoice.cashReceived || 0) - invoice.finalAmount) : 0;
    await invoice.save({ session });
    return { data: result, status };
  });
}
