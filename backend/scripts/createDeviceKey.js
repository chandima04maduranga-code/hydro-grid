// Creates (or replaces) a company's device key for its sensor nodes.
// The plain key is written to the git-ignored backend/.device-keys.json, where
// the virtual nodes read it; only its hash is stored in the database.
// Replacing a key stops nodes that still use the old one.
//
// Usage: npm run device-key -- <companyId>
const mongoose = require('mongoose');
const Company = require('../models/Company');
const { generateDeviceKey, hashDeviceKey, saveKey, KEYS_FILE } = require('../utils/deviceKeys');
const { connectDb } = require('./lib/cli');

const main = async () => {
  const companyId = process.argv[2];
  if (!mongoose.isValidObjectId(companyId)) {
    console.error('❌ Usage: npm run device-key -- <companyId>');
    process.exitCode = 1;
    return;
  }

  await connectDb();
  const key = generateDeviceKey();
  const company = await Company.findByIdAndUpdate(companyId, { deviceKeyHash: hashDeviceKey(key) }, { new: true });
  if (!company) {
    console.error('❌ No company with that id.');
    process.exitCode = 1;
    return;
  }

  saveKey(company._id, key);
  console.log(`✅ New device key for ${company.name} saved to ${KEYS_FILE}`);
  console.log('   Restart its virtual nodes so they use the new key.');
};

main()
  .catch((err) => {
    console.error('❌ Could not create the device key:', err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
