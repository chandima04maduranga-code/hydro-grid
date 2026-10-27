// Creates a platform administrator: the account that approves and manages
// companies. Platform admins belong to no company.
// Usage: npm run create-platform-admin   (from the project or backend folder)
// The password is typed interactively and never stored in shell history.
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { connectDb, createPrompter } = require('./lib/cli');

const prompt = createPrompter();

const main = async () => {
  await connectDb();
  console.log('\nHydro_Grid — create platform administrator\n');

  const person = await prompt.askPerson();
  const admin = await User.create({
    name: person.name,
    email: person.email,
    phone: person.phone,
    password: await bcrypt.hash(person.password, 12),
    role: 'platform_admin',
    status: 'active',
    reviewedAt: new Date()
  });

  console.log(`\n✅ Platform administrator created: ${admin.name} <${admin.email}>`);
  console.log('   Log in at http://localhost:5173 and choose "Hydro_Grid platform" as the company\n');
};

main()
  .catch((err) => {
    console.error('❌ Failed to create platform administrator:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    prompt.close();
    await mongoose.disconnect();
  });
