// Migration 002: crop records store codes instead of display text.
// "Fruit vegetable" → fruitVegetable, "Harvest Ready" → harvestReady,
// "Nutrient Warning" → nutrientWarning, ... The UI translates the codes.
// Safe to run more than once.
//
// Usage (from the backend folder): node scripts/migrations/002-crop-codes.js
const mongoose = require('mongoose');
const { connectDb } = require('../lib/cli');
const { CROP_TYPES, GROWTH_STAGES, HEALTH_STATUSES } = require('../../config/plants');

// "Leafy green" / "Leafy Green" → "leafyGreen"
const toCode = (text) =>
  String(text)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+(.)/g, (match, letter) => letter.toUpperCase());

const FIELDS = { cropType: CROP_TYPES, growthStage: GROWTH_STAGES, healthStatus: HEALTH_STATUSES };
const FALLBACK = { cropType: 'leafyGreen', growthStage: 'vegetative', healthStatus: 'healthy' };

const main = async () => {
  await connectDb();
  const plants = mongoose.connection.db.collection('plants');
  let changed = 0;

  for (const plant of await plants.find().toArray()) {
    const update = {};
    for (const [field, codes] of Object.entries(FIELDS)) {
      if (codes.includes(plant[field])) continue;
      const code = toCode(plant[field] ?? '');
      update[field] = codes.includes(code) ? code : FALLBACK[field];
    }
    if (Object.keys(update).length > 0) {
      await plants.updateOne({ _id: plant._id }, { $set: update });
      changed += 1;
    }
  }
  console.log(`✅ Crop codes migrated: ${changed} record(s) updated.`);
};

main()
  .catch((err) => {
    console.error('❌ Migration failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
