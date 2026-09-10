import mongoose from 'mongoose';
import { readFileSync } from 'node:fs';
import Dish from '../model/dish.js';
import Category from '../model/category.js';

export const drinkDishes = JSON.parse(readFileSync(new URL('../data/menu-drinks.json', import.meta.url), 'utf8'));
const Release = mongoose.models.MenuRelease || mongoose.model('MenuRelease', new mongoose.Schema({ _id: String, created: Number, completedAt: Date }));

// One-time, atomic content release. Repeated deploys never resurrect dishes
// deleted by an administrator or overwrite subsequent menu edits.
export async function expandDrinkMenu() {
  await Promise.all([Release.init(), Dish.init(), Category.init()]);
  return mongoose.connection.transaction(async (session) => {
    const releaseId = 'menu-drinks-6-20260910';
    if (await Release.findById(releaseId).session(session)) return 0;
    let created = 0;
    for (const { source, originalImage, ...content } of drinkDishes) {
      const category = 'Đồ uống';
      const entry = { ...content, type: 'Drink', servingUnit: 'Ly', stock: 50, discount: 0, isFeatured: false, status: 'Available' };
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
