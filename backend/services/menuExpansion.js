import mongoose from 'mongoose';
import { readFileSync } from 'node:fs';
import Dish from '../model/dish.js';
import Category from '../model/category.js';

export const expansionDishes = readFileSync(new URL('../data/menu-expansion-50.txt', import.meta.url), 'utf8').trim().split(/\r?\n/).map((line, index) => {
  const [name, category, price, description] = line.split('|');
  return { name, category, price: Number(price), description, code: `BV50-${String(index + 1).padStart(3, '0')}`, type: category.startsWith('Tráng') ? 'Dessert' : ['Món khai vị', 'Gỏi', 'Chiên & Rán'].includes(category) ? 'SideDish' : 'MainCourse', servingUnit: 'Phần', stock: 30, discount: 0, isFeatured: false, status: 'Available' };
});
const Release = mongoose.models.MenuRelease || mongoose.model('MenuRelease', new mongoose.Schema({ _id: String, created: Number, completedAt: Date }));

// One-time, atomic content release. Repeated deploys never resurrect dishes
// deleted by an administrator or overwrite subsequent menu edits.
export async function expandMenu50() {
  await Promise.all([Release.init(), Dish.init(), Category.init()]);
  return mongoose.connection.transaction(async (session) => {
    const releaseId = 'menu-expansion-50-20260909';
    if (await Release.findById(releaseId).session(session)) return 0;
    let created = 0;
    for (const { category, ...entry } of expansionDishes) {
      if (await Dish.findOne({ name: entry.name, isDeleted: { $in: [true, false] } }).session(session)) continue;
      let group = await Category.findOne({ name: category }).session(session);
      if (!group) [group] = await Category.create([{ name: category, description: `Các món thuộc nhóm ${category}.`, status: 'active' }], { session });
      await Dish.create([{ ...entry, categoryId: group._id }], { session });
      created += 1;
    }
    await Release.create([{ _id: releaseId, created, completedAt: new Date() }], { session });
    return created;
  });
}
