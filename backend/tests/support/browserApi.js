import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { fileURLToPath } from 'node:url';
import authRoutes from '../../router/authRoutes.js';
import dishRoutes from '../../router/dishRoutes.js';
import reservationRoutes from '../../router/reservationRoutes.js';
import assignmentRoutes from '../../router/reservationtableRoutes.js';
import tableRoutes from '../../router/tableRoutes.js';
import invoiceRoutes from '../../router/invoiceRoutes.js';
import detailRoutes from '../../router/invoicedetailRoutes.js';
import User from '../../model/User.js';
import Category from '../../model/category.js';
import Dish from '../../model/dish.js';
import Table from '../../model/table.js';
import Invoice from '../../model/invoice.js';
import Reservation from '../../model/reservation.js';

// Only imported by browser tests; no production .env or cloud services.
export async function startBrowserApi() {
  process.env.JWT_SECRET = 'browser-integration-test-only';
  for (const key of ['RESEND_API_KEY', 'TWILIO_ACCOUNT_SID', 'STRIPE_SECRET_KEY', 'BANK_ID', 'BANK_ACCOUNT_NO']) delete process.env[key];
  const mongo = await MongoMemoryReplSet.create({ binary: { downloadDir: fileURLToPath(new URL('../../node_modules/.cache/mongodb-memory-server', import.meta.url)) }, replSet: { count: 1 } });
  await mongoose.connect(mongo.getUri());
  const password = await bcrypt.hash('browser-test-only', 4);
  const [customer, staff] = await User.create(['user', 'staff'].map((role) => ({ name: `Browser ${role}`, email: `${role}@example.invalid`, phone: 901234567, address: 'Test only', role, password })));
  const category = await Category.create({ name: 'Món thử', description: 'Integration test only' });
  const dish = await Dish.create({ categoryId: category._id, code: 'E2E', name: 'Món kiểm thử', type: 'MainCourse', servingUnit: 'Phần', price: 100000, discount: 10, stock: 100 });
  const table = await Table.create({ tableNumber: 'TEST-1', capacity: 4 });
  await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
  const app = express();
  app.use(express.json());
  for (const [path, router] of Object.entries({ auth: authRoutes, dishes: dishRoutes, tables: tableRoutes, reservations: reservationRoutes, 'reservation-tables': assignmentRoutes, invoices: invoiceRoutes, 'invoice-details': detailRoutes })) app.use(`/${path}`, router);
  const server = await new Promise((resolve) => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  return {
    url: `http://127.0.0.1:${server.address().port}`, customer, staff, dish, table, Invoice, Reservation,
    async close() { await new Promise((resolve) => server.close(resolve)); await mongoose.disconnect(); await mongo.stop(); },
  };
}
