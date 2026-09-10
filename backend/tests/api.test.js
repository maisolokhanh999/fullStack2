import { before, after, beforeEach, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import request from 'supertest';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import User from '../model/User.js';
import Reservation from '../model/reservation.js';
import Invoice from '../model/invoice.js';
import InvoiceDetail from '../model/invoiceDetail.js';
import Table from '../model/table.js';
import Dish from '../model/dish.js';
import { completeMenuContent } from '../services/menuContent.js';
import { expandMenu50, expansionDishes } from '../services/menuExpansion.js';
import { completeExpansionPhotos, expansionPhotos } from '../services/menuPhotos.js';
import { existsSync } from 'node:fs';
import '../model/category.js';
import dishRoutes from '../router/dishRoutes.js';
import ReservationTable from '../model/reservationTable.js';
import reservationRoutes from '../router/reservationRoutes.js';
import invoiceRoutes from '../router/invoiceRoutes.js';
import detailRoutes from '../router/invoicedetailRoutes.js';
import assignmentRoutes from '../router/reservationtableRoutes.js';
import userRoutes from '../router/userRoutes.js';
import authRoutes from '../router/authRoutes.js';
import tableRoutes from '../router/tableRoutes.js';

// Isolated database and test credentials. Never import server.js or load .env.
process.env.JWT_SECRET = 'integration-test-secret-only';
delete process.env.RESEND_API_KEY;
delete process.env.TWILIO_ACCOUNT_SID;
delete process.env.STRIPE_SECRET_KEY;
const app = express();
app.use(express.json());
app.use('/dishes', dishRoutes);
for (const [path, router] of Object.entries({ reservations: reservationRoutes, invoices: invoiceRoutes, 'invoice-details': detailRoutes, 'reservation-tables': assignmentRoutes, users: userRoutes, auth: authRoutes, tables: tableRoutes })) app.use(`/${path}`, router);
let mongo, owner, other, staff, admin, table, dish;
const token = (user) => `Bearer ${jwt.sign({ id: user._id }, process.env.JWT_SECRET)}`;
const future = () => { const d = new Date(Date.now() + 86400000 * 2); return `${d.toISOString().slice(0, 10)}T12:00:00+07:00`; };
const payload = (extra = {}) => ({ customerName: 'Test Guest', customerPhone: '0901234567', numberOfGuests: 2, expectedCheckInTime: future(), tableId: String(table._id), preorderItems: [{ dishId: String(dish._id), quantity: 2 }], ...extra });
const book = (extra = {}, user = owner) => request(app).post('/reservations').set('Authorization', token(user)).send(payload(extra));
before(async () => {
  mongo = await MongoMemoryReplSet.create({ binary: { downloadDir: fileURLToPath(new URL('../node_modules/.cache/mongodb-memory-server', import.meta.url)) }, replSet: { count: 1 } });
  await mongoose.connect(mongo.getUri());
  await Promise.all([User, Reservation, Invoice, InvoiceDetail, Table, Dish, ReservationTable].map((model) => model.init()));
});
after(async () => { await mongoose.disconnect(); await mongo?.stop(); });
beforeEach(async () => {
  await Promise.all(Object.values(mongoose.models).map((model) => model.deleteMany({})));
  const password = await bcrypt.hash('test-password', 4);
  [owner, other, staff, admin] = await User.create(['user', 'user', 'staff', 'admin'].map((role, index) => ({ name: `Test ${index}`, email: `test${index}@example.invalid`, phone: 901234567, address: 'Test only', password, role })));
  table = await Table.create({ tableNumber: 'A1', capacity: 4 });
  dish = await Dish.create({ categoryId: new mongoose.Types.ObjectId(), code: 'TEST', name: 'Test dish', type: 'MainCourse', servingUnit: 'Phần', price: 100000, discount: 10, stock: 100 });
});

test('50 photo assets exist and backfill preserves custom images and deleted dishes', async () => {
  assert.equal(expansionPhotos.length, 50);
  assert.equal(new Set(expansionPhotos.map(item => item.code)).size, 50);
  for (const photo of expansionPhotos) {
    assert.ok(existsSync(new URL(`../public/${photo.image.replace('/media/', '')}`, import.meta.url)));
    assert.match(photo.source, /^https:\/\//);
    assert.equal(expansionDishes.find(item => item.code === photo.code).name, photo.name);
  }
  await expandMenu50();
  await Dish.updateOne({ code: 'BV50-001' }, { image: 'https://example.invalid/restaurant.webp' });
  await Dish.updateOne({ code: 'BV50-002' }, { isDeleted: true });
  assert.equal(await completeExpansionPhotos(), 48);
  assert.equal(await completeExpansionPhotos(), 0);
  assert.equal((await Dish.findOne({ code: 'BV50-001' })).image, 'https://example.invalid/restaurant.webp');
  assert.equal((await Dish.findOne({ code: 'BV50-002', isDeleted: true })).image, '');
});

test('menu expansion adds exactly 50 unique dishes once and preserves later edits', async () => {
  assert.equal(expansionDishes.length, 50);
  assert.equal(new Set(expansionDishes.map(item => item.name)).size, 50);
  assert.equal(await expandMenu50(), 50);
  assert.equal(await Dish.countDocuments(), 51);
  const first = await Dish.findOne({ code: 'BV50-001' });
  await Dish.updateOne({ _id: first._id }, { price: 123000, isDeleted: true });
  assert.equal(await expandMenu50(), 0);
  assert.equal(await Dish.countDocuments(), 51);
  assert.equal((await Dish.findOne({ _id: first._id, isDeleted: true })).price, 123000);
});

test('menu content backfill only fills blanks and is safe to run again', async () => {
  await Dish.updateOne({ _id: dish._id }, { name: 'Cơm chiên hải sản', description: '', image: 'https://example.invalid/own.jpg' });
  assert.equal(await completeMenuContent(), 1);
  const filled = await Dish.findById(dish._id);
  assert.match(filled.description, /tôm, mực/);
  assert.equal(filled.image, 'https://example.invalid/own.jpg');
  assert.equal(filled.price, 100000);
  assert.equal(await completeMenuContent(), 0);
  await Dish.updateOne({ _id: dish._id }, { name: 'Gỏi cuốn tôm thịt', image: '', description: 'Restaurant description' });
  assert.equal(await completeMenuContent(), 1);
  assert.equal((await Dish.findById(dish._id)).image, '/media/menu/goi-cuon.jpg');
  assert.equal((await Dish.findById(dish._id)).description, 'Restaurant description');
});

test('dish pagination excludes deleted dishes and rejects invalid limits', async () => {
  await Dish.create({ categoryId: dish.categoryId, code: 'DELETED', name: 'Deleted dish', type: 'MainCourse', servingUnit: 'Phần', price: 100, stock: 1, isDeleted: true });
  const { body } = await request(app).get('/dishes?limit=100').expect(200);
  assert.equal(body.pagination.total, 1);
  assert.equal(body.data.length, 1);
  for (const query of ['page=0', 'limit=0', 'limit=501', 'page=1.5']) await request(app).get(`/dishes?${query}`).expect(400);
});

test('anonymous callers cannot read personal records; users cannot list users or change tables', async () => {
  for (const path of ['/users', '/reservations', '/reservation-tables', `/invoice-details/invoice/${new mongoose.Types.ObjectId()}`]) await request(app).get(path).expect(401);
  await request(app).get('/users').set('Authorization', token(owner)).expect(403);
  await request(app).patch(`/tables/${table._id}/status`).set('Authorization', token(owner)).send({ status: 'Available' }).expect(403);
});

test('booking atomically holds a table, prices discounted dishes, and ignores client-supplied deposit', async () => {
  const response = await book({ depositAmount: 1 }).expect(201);
  const reservation = await Reservation.findOne();
  const invoice = await Invoice.findOne();
  assert.equal(response.body.data._id, String(reservation._id));
  assert.equal(invoice.totalAmount, 180000);
  assert.equal(invoice.depositAmount, 40000);
  assert.equal(invoice.finalAmount, 180000);
  assert.equal(invoice.depositPaymentStatus, 'Pending');
  assert.equal(invoice.paymentDate, null);
  assert.equal((await Table.findById(table._id)).status, 'Reserved');
  assert.equal(await ReservationTable.countDocuments(), 1);
  assert.equal(await InvoiceDetail.countDocuments(), 1);
});

test('simultaneous requests for one table create exactly one complete booking', async () => {
  const responses = await Promise.all([book(), book({}, other)]);
  assert.deepEqual(responses.map((r) => r.status).sort(), [201, 409]);
  for (const model of [Reservation, Invoice, ReservationTable, InvoiceDetail]) assert.equal(await model.countDocuments(), 1);
});

test('validation failure after table acquisition rolls back all records and table status', async () => {
  await book({ reservationType: 'Invalid' }).expect(400);
  for (const model of [Reservation, Invoice, ReservationTable, InvoiceDetail]) assert.equal(await model.countDocuments(), 0);
  assert.equal((await Table.findById(table._id)).status, 'Available');
});

test('bad dates, fractional quantities, and unavailable dishes do not create a booking', async () => {
  await book({ expectedCheckInTime: '2000-01-01T12:00:00+07:00' }).expect(400);
  await book({ preorderItems: [{ dishId: String(dish._id), quantity: 1.5 }] }).expect(400);
  await Dish.findByIdAndUpdate(dish._id, { status: 'Unavailable' });
  await book().expect(400);
  assert.equal(await Reservation.countDocuments(), 0);
});

test('customer ownership protects lists, details, assignments and writes', async () => {
  await book().expect(201);
  const r = await Reservation.findOne(), i = await Invoice.findOne(), d = await InvoiceDetail.findOne(), a = await ReservationTable.findOne();
  const list = await request(app).get('/reservations').set('Authorization', token(other)).expect(200);
  assert.equal(list.body.data.length, 0);
  for (const path of [`/reservations/${r._id}`, `/invoices/${i._id}`, `/invoice-details/invoice/${i._id}`, `/invoice-details/${d._id}`, `/reservation-tables/${a._id}`]) {
    await request(app).get(path).set('Authorization', token(other)).expect(403);
    await request(app).get(path).set('Authorization', token(owner)).expect(200);
  }
  await request(app).put(`/reservations/${r._id}`).set('Authorization', token(other)).send({ note: 'changed' }).expect(403);
  await request(app).put(`/reservations/${r._id}`).set('Authorization', token(owner)).send({ status: 'Completed', bookedBy: other._id, depositAmount: 0 }).expect(400);
  assert.equal((await Reservation.findById(r._id)).status, 'Pending');
});

test('only staff can confirm received deposit; confirmation deducts it once and cannot rewrite the amount', async () => {
  await book().expect(201);
  const i = await Invoice.findOne();
  const path = `/invoices/${i._id}/confirm-deposit`;
  await request(app).patch(path).set('Authorization', token(owner)).expect(403);
  for (let n = 0; n < 2; n++) {
    const response = await request(app).patch(path).set('Authorization', token(staff)).expect(200);
    assert.equal(response.body.data.finalAmount, 140000);
  }
  await request(app).put(`/invoices/${i._id}`).set('Authorization', token(staff)).send({ depositAmount: 80000 }).expect(400);
  await request(app).post(`/invoices/${i._id}/deposit-payment`).set('Authorization', token(owner)).expect(400);
});

test('blocked accounts cannot use existing tokens or log in; admin can assign staff role', async () => {
  await User.findByIdAndUpdate(owner._id, { status: 'Blocked' });
  await request(app).get('/auth/me').set('Authorization', token(owner)).expect(403);
  await request(app).post('/auth/login').send({ email: owner.email, password: 'test-password' }).expect(403);
  await request(app).put(`/users/${other._id}/role`).set('Authorization', token(admin)).send({ role: 'staff' }).expect(200);
  assert.equal((await User.findById(other._id)).role, 'staff');
});

test('staff item validation rejects fractional and accumulated excessive quantities', async () => {
  await book().expect(201);
  const i = await Invoice.findOne(), d = await InvoiceDetail.findOne();
  await request(app).put(`/invoice-details/${d._id}`).set('Authorization', token(staff)).send({ quantity: 1.5 }).expect(400);
  await request(app).post('/invoice-details').set('Authorization', token(staff)).send({ invoiceId: i._id, dishId: dish._id, quantity: 99 }).expect(400);
  assert.equal((await InvoiceDetail.findById(d._id)).quantity, 2);
});

test('payment requires staff, a finalized invoice and sufficient cash; concurrent confirmation succeeds once', async () => {
  await book().expect(201);
  const i = await Invoice.findOne();
  const path = `/invoices/${i._id}/pay`;
  await request(app).patch(path).set('Authorization', token(owner)).send({ paymentMethod: 'Cash', cashReceived: 200000 }).expect(403);
  await request(app).patch(path).set('Authorization', token(staff)).send({ paymentMethod: 'Cash', cashReceived: 200000 }).expect(400);
  await request(app).patch(`/invoices/${i._id}/finalize`).set('Authorization', token(staff)).expect(200);
  await request(app).patch(path).set('Authorization', token(staff)).send({ paymentMethod: 'Cash', cashReceived: 1 }).expect(400);
  const responses = await Promise.all([staff, admin].map((u) => request(app).patch(path).set('Authorization', token(u)).send({ paymentMethod: 'Cash', cashReceived: 200000 })));
  assert.equal(responses.filter((r) => r.status === 200).length, 1);
  const paid = await Invoice.findById(i._id);
  assert.equal(paid.status, 'Paid');
  assert.equal(paid.changeAmount, 20000);
  assert.ok(paid.paymentDate);
  assert.equal((await Table.findById(table._id)).status, 'Reserved');
});

test('legacy assignment endpoint cannot double-book a table', async () => {
  await book({ tableId: undefined }).expect(201);
  await book({ tableId: undefined }, other).expect(201);
  const reservations = await Reservation.find().sort({ createdAt: 1 });
  const responses = await Promise.all(reservations.map((r) => request(app).post('/reservation-tables').set('Authorization', token(staff)).send({ reservationId: r._id, tableId: table._id })));
  assert.deepEqual(responses.map((r) => r.status).sort(), [201, 409]);
  assert.equal(await ReservationTable.countDocuments({ status: 'Active' }), 1);
});

test('concurrent item additions keep quantity and invoice total consistent', async () => {
  await book().expect(201);
  const i = await Invoice.findOne();
  const responses = await Promise.all([1, 2].map(() => request(app).post('/invoice-details').set('Authorization', token(staff)).send({ invoiceId: i._id, dishId: dish._id, quantity: 1 })));
  assert.ok(responses.every((r) => r.status === 200));
  assert.equal(await InvoiceDetail.countDocuments(), 1);
  assert.equal((await InvoiceDetail.findOne()).quantity, 4);
  assert.equal((await Invoice.findById(i._id)).finalAmount, 360000);
});

test('bulk failure rolls back earlier items; finalized invoices reject later writes', async () => {
  await book().expect(201);
  const i = await Invoice.findOne();
  await request(app).post('/invoice-details/bulk').set('Authorization', token(staff)).send({ invoiceId: i._id, items: [{ dishId: dish._id, quantity: 1 }, { dishId: new mongoose.Types.ObjectId(), quantity: 1 }] }).expect(404);
  assert.equal((await InvoiceDetail.findOne()).quantity, 2);
  await request(app).patch(`/invoices/${i._id}/finalize`).set('Authorization', token(staff)).expect(200);
  await request(app).post('/invoice-details').set('Authorization', token(staff)).send({ invoiceId: i._id, dishId: dish._id, quantity: 1 }).expect(400);
  assert.equal((await Invoice.findById(i._id)).finalAmount, 180000);
});

test('cancellation releases the table and cancels invoice without claiming money was refunded', async () => {
  await book().expect(201);
  const r = await Reservation.findOne(), i = await Invoice.findOne();
  await request(app).patch(`/invoices/${i._id}/confirm-deposit`).set('Authorization', token(staff)).expect(200);
  await request(app).patch(`/reservations/${r._id}/cancel`).set('Authorization', token(owner)).send({ reason: 'Test' }).expect(200);
  assert.equal((await Reservation.findById(r._id)).depositRefunded, false);
  assert.equal((await Invoice.findById(i._id)).status, 'Cancelled');
  assert.equal((await Table.findById(table._id)).status, 'Available');
  assert.equal(await ReservationTable.countDocuments({ status: 'Active' }), 0);
  await request(app).post('/reservation-tables').set('Authorization', token(owner)).send({ reservationId: r._id, tableId: table._id }).expect(409);
});

test('cancelled invoice is locked against every payment path and excluded from monthly revenue', async () => {
  await book().expect(201);
  const i = await Invoice.findOne();
  await request(app).patch(`/invoices/${i._id}/cancel`).set('Authorization', token(staff)).expect(200);
  await request(app).patch(`/invoices/${i._id}/pay`).set('Authorization', token(staff)).send({ paymentMethod: 'Cash', cashReceived: 200000 }).expect(400);
  await request(app).post(`/invoices/${i._id}/deposit-payment`).set('Authorization', token(owner)).expect(400);
  const stats = await request(app).get('/invoices/stats').set('Authorization', token(staff)).expect(200);
  assert.equal(stats.body.data.some((item) => item.month === new Date().toISOString().slice(0, 7)), false);
  assert.equal((await Invoice.findById(i._id)).status, 'Cancelled');
});

test('checkin and cancellation racing cannot leave an occupied table with a cancelled reservation', async () => {
  await book().expect(201);
  const r = await Reservation.findOne();
  await Promise.all([
    request(app).patch(`/reservations/${r._id}/checkin`).set('Authorization', token(staff)),
    request(app).patch(`/reservations/${r._id}/cancel`).set('Authorization', token(owner)),
  ]);
  const status = (await Reservation.findById(r._id)).status;
  assert.ok(['CheckedIn', 'Cancelled'].includes(status));
  assert.equal((await Table.findById(table._id)).status, status === 'CheckedIn' ? 'Occupied' : 'Available');
});

test('table management cannot reset or delete an assigned table; releasing a blocked assignment frees it', async () => {
  await book().expect(201);
  const a = await ReservationTable.findOne();
  await request(app).patch(`/tables/${table._id}/status`).set('Authorization', token(staff)).send({ status: 'Available' }).expect(409);
  await request(app).delete(`/tables/${table._id}`).set('Authorization', token(admin)).expect(409);
  await request(app).patch(`/reservation-tables/${a._id}/block`).set('Authorization', token(staff)).expect(200);
  await request(app).patch(`/reservation-tables/${a._id}/release`).set('Authorization', token(staff)).expect(200);
  assert.equal((await Table.findById(table._id)).status, 'Available');
  assert.equal((await ReservationTable.findById(a._id)).status, 'Inactive');
});

test('malformed authentication fields return client errors', async () => {
  await request(app).post('/auth/register').send({ name: {}, email: [], password: {}, address: 1 }).expect(400);
  await request(app).post('/auth/login').send({ email: owner.email, password: {} }).expect(400);
});

test('legacy finalized invoices cannot undercharge an unconfirmed deposit', async () => {
  await book().expect(201);
  const i = await Invoice.findOne();
  await Invoice.findByIdAndUpdate(i._id, { status: 'Finalized', depositPaymentStatus: 'NotRequired', finalAmount: 140000 });
  const response = await request(app).get(`/invoices/${i._id}`).set('Authorization', token(staff)).expect(200);
  assert.equal(response.body.data.finalAmount, 180000);
  await request(app).patch(`/invoices/${i._id}/pay`).set('Authorization', token(staff)).send({ paymentMethod: 'Cash', cashReceived: 140000 }).expect(400);
  assert.equal((await Invoice.findById(i._id)).status, 'Finalized');
});
