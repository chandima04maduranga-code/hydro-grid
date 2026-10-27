// Builds the demo described in demo-data.json: approved companies, their
// staff (one shared demo password), greenhouses with assigned staff, one
// sensor node per greenhouse with 24 hours of realistic readings, and crop
// records. Anything that already exists is kept, so it is safe to re-run.
//
// Usage: npm run setup-demo   (from the project or backend folder)
// Password: DEMO_PASSWORD in backend/.env, otherwise asked (hidden).
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Company = require('../models/Company');
const User = require('../models/User');
const Greenhouse = require('../models/Greenhouse');
const SensorNode = require('../models/SensorNode');
const Reading = require('../models/Reading');
const Plant = require('../models/Plant');
const { PLANS } = require('../config/plans');
const { CROPS } = require('../config/crops');
const { METRICS } = require('../config/metrics');
const { isStrongPassword, MIN_PASSWORD_LENGTH } = require('../utils/validators');
const { connectDb, createPrompter } = require('./lib/cli');

const DEMO_FILE = path.join(__dirname, 'demo-data.json');
const DAY_MS = 24 * 60 * 60 * 1000;
const HISTORY_STEP_MINUTES = 10;

const prompt = createPrompter();

const getPassword = async () => {
  const fromEnv = process.env.DEMO_PASSWORD;
  if (fromEnv) {
    if (!isStrongPassword(fromEnv)) throw new Error(`DEMO_PASSWORD needs at least ${MIN_PASSWORD_LENGTH} characters with letters and numbers`);
    return fromEnv;
  }
  console.log('One password is used for every demo account.');
  for (;;) {
    const password = await prompt.askUntilValid(
      `Demo password (min ${MIN_PASSWORD_LENGTH} chars, letters and numbers): `,
      isStrongPassword,
      `Password needs at least ${MIN_PASSWORD_LENGTH} characters, including a letter and a number`,
      true
    );
    if ((await prompt.askHidden('Confirm demo password: ')) === password) return password;
    console.log('  ✖ Passwords do not match, please type them again');
  }
};

// Sri Lankan hour of day as a fraction, e.g. 13.5 = 1:30 PM
const colomboHour = (date) => {
  const [hour, minute] = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Colombo', hour: 'numeric', minute: 'numeric', hour12: false })
    .format(date).split(':').map(Number);
  return hour + minute / 60;
};
const dayCurve = (hour) => {
  const curve = Math.sin(((hour - 6) / 12) * Math.PI);
  return curve > 0 ? curve : curve * 0.4;
};
const round = (value) => Math.round(value * 100) / 100;

// 24 hours of readings that follow the day on Sri Lanka time, with slow
// drifts in reservoir level, pH, EC (within the crop's band) and moisture
const buildHistory = (companyId, nodeId, crop, now) => {
  const [ecLow, ecHigh] = CROPS[crop]?.ec || METRICS.ec.optimal;
  let level = 90;
  let ph = 5.8;
  let ec = ecHigh * 0.95;
  let substrate = 66;
  const readings = [];
  const latest = {};

  for (let step = (24 * 60) / HISTORY_STEP_MINUTES; step >= 0; step -= 1) {
    const at = new Date(now.getTime() - step * HISTORY_STEP_MINUTES * 60 * 1000);
    const day = dayCurve(colomboHour(at));
    level -= 0.35; if (level < 25) level = 92;
    ph += 0.008; if (ph > 6.8) ph = 5.8;
    ec -= (ecHigh - ecLow) * 0.012; if (ec < ecLow * 0.85) ec = ecHigh * 0.95;
    substrate -= 0.3 + Math.max(0, day) * 0.4; if (substrate < 34) substrate = 68;
    const waterTemp = 20.5 + day * 4;

    const values = {
      waterTemp, ph, ec,
      dissolvedOxygen: 8.6 - (waterTemp - 18) * 0.18,
      waterLevel: level,
      flowRate: 2.4 + Math.sin(step) * 0.2,
      airTemp: 22 + day * 7,
      humidity: 76 - day * 20,
      light: Math.max(0, day) * 620,
      co2: day > 0 ? 450 : 720,
      substrateMoisture: substrate
    };
    for (const [metric, value] of Object.entries(values)) {
      readings.push({ company: companyId, nodeId, metric, value: round(value), recordedAt: at });
      latest[metric] = { value: round(value), recordedAt: at };
    }
  }
  return { readings, latest };
};

const ensureCompany = async (demo, reviewer, now) => {
  const existing = await Company.findOne({ nameKey: Company.toNameKey(demo.name) });
  if (existing) return { company: existing, created: false };

  const company = await Company.create({
    name: demo.name,
    nameKey: Company.toNameKey(demo.name),
    district: demo.district,
    contactEmail: demo.users.find((user) => user.role === 'admin').email,
    status: 'active',
    plan: demo.plan,
    billingCycle: demo.billingCycle,
    trialEndsAt: demo.plan === 'trial' ? new Date(now.getTime() + PLANS.trial.trialDays * DAY_MS) : undefined,
    reviewedBy: reviewer?._id,
    reviewedAt: now
  });
  return { company, created: true };
};

const ensureUsers = async (demo, company, passwordHash, now) => {
  const byKey = {};
  for (const person of demo.users) {
    let user = await User.findOne({ email: person.email });
    if (user && String(user.company) !== String(company._id)) {
      throw new Error(`${person.email} already belongs to another company`);
    }
    if (!user) {
      user = await User.create({
        company: company._id,
        name: person.name,
        email: person.email,
        password: passwordHash,
        role: person.role,
        status: 'active',
        reviewedAt: now
      });
    }
    byKey[person.key] = user;
  }
  return byKey;
};

const ensureGreenhouse = async (company, spec, users) => {
  let greenhouse = await Greenhouse.findOne({ company: company._id, district: spec.district, name: spec.name, archivedAt: null });
  if (!greenhouse) {
    const top = await Greenhouse.findOne({ company: company._id, district: spec.district }).sort({ number: -1 }).select('number');
    greenhouse = new Greenhouse({
      company: company._id,
      district: spec.district,
      number: (top?.number || 0) + 1,
      name: spec.name,
      systemType: spec.systemType,
      mainCrop: spec.mainCrop,
      areaSqm: spec.areaSqm,
      status: 'active'
    });
  }
  greenhouse.assignedUsers = spec.staff.map((key) => users[key]._id);
  await greenhouse.save();
  return greenhouse;
};

const ensureNode = async (company, greenhouse, spec, now) => {
  const existing = await SensorNode.findOne({ company: company._id, nodeId: spec.node.nodeId });
  if (existing) {
    existing.greenhouse = greenhouse._id;
    existing.cropProfile = spec.mainCrop;
    await existing.save();
    return { node: existing, created: false };
  }

  const { readings, latest } = buildHistory(company._id, spec.node.nodeId, spec.mainCrop, now);
  await Reading.insertMany(readings);
  const node = await SensorNode.create({
    company: company._id,
    nodeId: spec.node.nodeId,
    name: `${spec.name} sensor`,
    location: spec.node.location,
    greenhouse: greenhouse._id,
    cropProfile: spec.mainCrop,
    latest,
    lastSeenAt: now
  });
  return { node, created: true, readings: readings.length };
};

const ensureCrops = async (company, greenhouse, spec, photos) => {
  let created = 0;
  for (const crop of spec.crops) {
    if (await Plant.exists({ company: company._id, name: crop.name })) continue;
    await Plant.create({
      company: company._id,
      greenhouse: greenhouse._id,
      name: crop.name,
      species: crop.species,
      cropType: crop.cropType,
      growthStage: crop.growthStage,
      healthStatus: crop.healthStatus,
      systemId: spec.node.nodeId,
      image: photos[crop.photo].url
    });
    created += 1;
  }
  return created;
};

const main = async () => {
  const demo = JSON.parse(fs.readFileSync(DEMO_FILE, 'utf8'));
  console.log('\nHydro_Grid — demo setup\n');
  const password = await getPassword();
  await connectDb();
  await Promise.all([Company.init(), User.init(), Greenhouse.init(), SensorNode.init(), Reading.init(), Plant.init()]);

  const passwordHash = await bcrypt.hash(password, 12);
  const reviewer = await User.findOne({ role: 'platform_admin' }).select('_id');
  const now = new Date();
  const simulatorCommands = [];

  for (const companySpec of demo.companies) {
    const { company, created } = await ensureCompany(companySpec, reviewer, now);
    console.log(`\n▶ ${company.name}  (${company.district}, ${company.plan})  ${created ? 'created' : 'already exists'}`);

    const users = await ensureUsers(companySpec, company, passwordHash, now);
    for (const person of companySpec.users) {
      console.log(`   👤 ${person.name.padEnd(28)} ${person.email.padEnd(28)} ${person.role}`);
    }

    const nodeArgs = [];
    for (const spec of companySpec.greenhouses) {
      const greenhouse = await ensureGreenhouse(company, spec, users);
      const nodeResult = await ensureNode(company, greenhouse, spec, now);
      const crops = await ensureCrops(company, greenhouse, spec, demo.photos);
      console.log(`   🏠 ${`${greenhouse.code} · ${greenhouse.name}`.padEnd(40)} staff: ${spec.staff.join(', ')} · node ${spec.node.nodeId}${nodeResult.created ? ` (+${nodeResult.readings} readings)` : ''} · ${crops} new crops`);
      nodeArgs.push(`${spec.node.nodeId}:${spec.mainCrop}`);
    }
    simulatorCommands.push({ company: company.name, command: `npm run simulate -- ${company._id} ${nodeArgs.join(',')} 10` });
  }

  console.log('\n✅ Demo ready. Log in at http://localhost:5173: choose the company, then use any demo email above with the demo password.');
  console.log('\nLive sensors (one terminal each):');
  for (const { company, command } of simulatorCommands) console.log(`   ${company}:\n     ${command}`);
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
