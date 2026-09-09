import { readFileSync } from 'node:fs';
import Dish from '../model/dish.js';
export const expansionPhotos = JSON.parse(readFileSync(new URL('../data/menu-photos-50.json', import.meta.url), 'utf8'));
export async function completeExpansionPhotos() {
  const result = await Dish.bulkWrite(expansionPhotos.map(({ code, name, image }) => ({ updateOne: {
    filter: { code, name, isDeleted: false, $or: [{ image: { $exists: false } }, { image: null }, { image: /^\s*$/ }] },
    update: { $set: { image } },
  } })));
  return result.modifiedCount;
}
