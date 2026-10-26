// Migration 001: sensor node ids become unique per company instead of globally.
// Drops the old single-field unique index on sensors.hardwareId. Deletes no data.
// Usage: node scripts/migrations/001-sensor-ids-per-company.js   (from backend/)
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');

if (process.env.DNS_SERVERS) {
  require('dns').setServers(process.env.DNS_SERVERS.split(',').map((server) => server.trim()));
}

const OLD_INDEX = 'hardwareId_1';

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const sensors = mongoose.connection.db.collection('sensors');
  const indexes = await sensors.indexes().catch(() => []);

  if (indexes.some((index) => index.name === OLD_INDEX)) {
    await sensors.dropIndex(OLD_INDEX);
    console.log(`✅ Dropped index ${OLD_INDEX}`);
  } else {
    console.log(`ℹ️  Index ${OLD_INDEX} not present, nothing to do`);
  }

  await sensors.createIndex({ company: 1, hardwareId: 1 }, { unique: true });
  console.log('✅ Ensured unique index on { company, hardwareId }');
};

run()
  .catch((err) => {
    console.error('❌ Migration failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
