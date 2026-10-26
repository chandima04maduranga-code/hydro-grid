// Creates the first (or an additional) administrator account.
// Usage: npm run create-admin   (from the backend folder)
// The password is typed interactively and never stored in shell history.
require('dotenv').config({ quiet: true });
const readline = require('readline');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const {
  isNonEmptyString,
  isValidEmail,
  isValidLkMobile,
  normaliseLkMobile,
  isStrongPassword,
  MIN_PASSWORD_LENGTH
} = require('../utils/validators');

if (process.env.DNS_SERVERS) {
  require('dns').setServers(process.env.DNS_SERVERS.split(',').map((server) => server.trim()));
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

const ask = (question) => new Promise((resolve) => rl.question(question, (answer) => resolve(answer.trim())));

// Asks a question without echoing what is typed
const askHidden = (question) => new Promise((resolve) => {
  const write = rl._writeToOutput;
  rl._writeToOutput = (text) => {
    if (text.includes(question)) write.call(rl, text);
  };
  rl.question(question, (answer) => {
    rl._writeToOutput = write;
    process.stdout.write('\n');
    resolve(answer);
  });
});

const askUntilValid = async (question, isValid, errorMessage, hidden = false) => {
  for (;;) {
    const answer = hidden ? await askHidden(question) : await ask(question);
    if (isValid(answer)) return answer;
    console.log(`  ✖ ${errorMessage}`);
  }
};

const main = async () => {
  if (!process.env.MONGO_URI) {
    console.error('❌ MONGO_URI is missing. Set up backend/.env first.');
    process.exit(1);
  }

  console.log('\nHydro_Grid — create administrator account\n');

  const name = await askUntilValid('Full name: ', isNonEmptyString, 'Name is required');
  const email = await askUntilValid('Email: ', isValidEmail, 'Enter a valid email address');
  const phone = await askUntilValid(
    'Mobile (07XXXXXXXX, optional): ',
    (value) => value === '' || isValidLkMobile(value),
    'Use a Sri Lankan mobile number like 0771234567'
  );
  const password = await askUntilValid(
    `Password (min ${MIN_PASSWORD_LENGTH} chars, letters and numbers): `,
    isStrongPassword,
    `Password needs at least ${MIN_PASSWORD_LENGTH} characters, including a letter and a number`,
    true
  );
  const confirm = await askHidden('Confirm password: ');
  if (confirm !== password) {
    console.error('❌ Passwords do not match. Nothing was created.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  const normalisedEmail = email.toLowerCase();
  if (await User.exists({ email: normalisedEmail })) {
    console.error(`❌ An account with ${normalisedEmail} already exists. Nothing was created.`);
    process.exit(1);
  }

  const admin = await User.create({
    name,
    email: normalisedEmail,
    phone: phone ? normaliseLkMobile(phone) : '',
    password: await bcrypt.hash(password, 12),
    role: 'admin',
    status: 'active',
    reviewedAt: new Date()
  });

  console.log(`\n✅ Administrator created: ${admin.name} <${admin.email}>`);
  console.log('   You can now log in at http://localhost:5173\n');
};

main()
  .catch((err) => {
    console.error('❌ Failed to create administrator:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    rl.close();
    await mongoose.disconnect();
  });
