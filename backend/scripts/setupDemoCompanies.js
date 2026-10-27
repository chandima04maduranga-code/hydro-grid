// Creates the demo companies listed in demo-companies.json, already approved,
// each with a company administrator whose details are typed in the terminal.
// Companies that already exist are skipped, so the script is safe to re-run.
// Usage: npm run setup-demo-companies   (from the project or backend folder)
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Company = require('../models/Company');
const User = require('../models/User');
const { PLANS, PLAN_IDS, BILLING_CYCLES } = require('../config/plans');
const { DISTRICTS } = require('../config/districts');
const { connectDb, createPrompter } = require('./lib/cli');

const DAY_MS = 24 * 60 * 60 * 1000;
const DEMO_FILE = path.join(__dirname, 'demo-companies.json');

const prompt = createPrompter();

const loadDemoCompanies = () => {
  const companies = JSON.parse(fs.readFileSync(DEMO_FILE, 'utf8'));
  for (const company of companies) {
    if (!DISTRICTS.includes(company.district)) throw new Error(`Unknown district "${company.district}" for ${company.name}`);
    if (!PLAN_IDS.includes(company.plan)) throw new Error(`Unknown plan "${company.plan}" for ${company.name}`);
    if (!BILLING_CYCLES.includes(company.billingCycle)) throw new Error(`Unknown billing cycle for ${company.name}`);
  }
  return companies;
};

const createCompany = async (demo, reviewer) => {
  console.log(`\n▶ ${demo.name}  (${demo.district}, ${demo.plan} plan)`);
  console.log('  Company administrator:');
  const person = await prompt.askPerson();
  const passwordHash = await bcrypt.hash(person.password, 12);
  const now = new Date();

  const session = await mongoose.startSession();
  let company;
  await session.withTransaction(async () => {
    [company] = await Company.create([{
      name: demo.name,
      nameKey: Company.toNameKey(demo.name),
      district: demo.district,
      contactEmail: person.email,
      contactPhone: person.phone,
      status: 'active',
      plan: demo.plan,
      billingCycle: demo.plan === 'trial' ? 'monthly' : demo.billingCycle,
      trialEndsAt: demo.plan === 'trial' ? new Date(now.getTime() + PLANS.trial.trialDays * DAY_MS) : undefined,
      reviewedBy: reviewer?._id,
      reviewedAt: now
    }], { session });

    await User.create([{
      company: company._id,
      name: person.name,
      email: person.email,
      phone: person.phone,
      password: passwordHash,
      role: 'admin',
      status: 'active',
      reviewedAt: now
    }], { session });
  });
  await session.endSession();

  console.log(`  ✅ Created ${company.name} with admin ${person.name} <${person.email}>`);
  return company;
};

const main = async () => {
  const demoCompanies = loadDemoCompanies();
  await connectDb();
  // Make sure unique indexes exist before creating data in a transaction
  await Promise.all([Company.init(), User.init()]);
  const reviewer = await User.findOne({ role: 'platform_admin' }).select('_id');

  console.log('\nHydro_Grid — set up demo companies');
  const results = [];
  for (const demo of demoCompanies) {
    const existing = await Company.findOne({ nameKey: Company.toNameKey(demo.name) });
    if (existing) {
      console.log(`\n▶ ${demo.name}: already exists, skipped`);
      results.push(existing);
    } else {
      results.push(await createCompany(demo, reviewer));
    }
  }

  console.log('\nCompany ids (for the IoT simulator: npm run simulate -- <companyId> 2):');
  for (const company of results) console.log(`  ${company.name.padEnd(28)} ${company._id}`);
  console.log('');
};

main()
  .catch((err) => {
    console.error('\n❌ Demo setup failed:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    prompt.close();
    await mongoose.disconnect();
  });
