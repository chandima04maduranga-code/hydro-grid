// Shared helpers for the interactive setup scripts: database connection and
// terminal prompts (passwords are typed hidden and never echoed).
require('dotenv').config({ quiet: true });
const readline = require('readline');
const mongoose = require('mongoose');
const User = require('../../models/User');
const {
  isNonEmptyString,
  isValidEmail,
  isValidLkMobile,
  normaliseLkMobile,
  isStrongPassword,
  MIN_PASSWORD_LENGTH
} = require('../../utils/validators');

if (process.env.DNS_SERVERS) {
  require('dns').setServers(process.env.DNS_SERVERS.split(',').map((server) => server.trim()));
}

const connectDb = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is missing. Set up backend/.env first.');
  }
  await mongoose.connect(process.env.MONGO_URI);
};

const createPrompter = () => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  // Typed (or pasted) lines are buffered, so none are lost while the script
  // is busy, e.g. checking the database between questions
  const lines = rl[Symbol.asyncIterator]();
  // Input can end early (piped answers); buffered lines are still read after that
  let inputClosed = false;
  rl.on('close', () => {
    inputClosed = true;
  });
  let muted = false;
  const write = rl._writeToOutput;
  rl._writeToOutput = (text) => {
    if (!muted) write.call(rl, text);
  };

  const readAnswer = async (question, hidden) => {
    if (inputClosed) {
      process.stdout.write(question);
    } else {
      rl.setPrompt(question);
      rl.prompt();
    }
    muted = hidden;
    const { value, done } = await lines.next();
    muted = false;
    if (hidden) process.stdout.write('\n');
    if (done) throw new Error('Input ended before all questions were answered');
    return value;
  };

  const ask = async (question) => (await readAnswer(question, false)).trim();

  // Asks a question without echoing what is typed
  const askHidden = (question) => readAnswer(question, true);

  const askUntilValid = async (question, isValid, errorMessage, hidden = false) => {
    for (;;) {
      const answer = hidden ? await askHidden(question) : await ask(question);
      if (await isValid(answer)) return answer;
      console.log(`  ✖ ${errorMessage}`);
    }
  };

  // Name, unused email, optional Sri Lankan mobile and a confirmed strong password
  const askPerson = async () => {
    const name = await askUntilValid('  Full name: ', isNonEmptyString, 'Name is required');
    const email = (await askUntilValid(
      '  Email: ',
      async (value) => isValidEmail(value) && !(await User.exists({ email: value.toLowerCase() })),
      'Enter a valid email address that is not already used'
    )).toLowerCase();
    const phone = await askUntilValid(
      '  Mobile (07XXXXXXXX, optional): ',
      (value) => value === '' || isValidLkMobile(value),
      'Use a Sri Lankan mobile number like 0771234567'
    );
    for (;;) {
      const password = await askUntilValid(
        `  Password (min ${MIN_PASSWORD_LENGTH} chars, letters and numbers): `,
        isStrongPassword,
        `Password needs at least ${MIN_PASSWORD_LENGTH} characters, including a letter and a number`,
        true
      );
      const confirm = await askHidden('  Confirm password: ');
      if (confirm === password) {
        return { name, email, phone: phone ? normaliseLkMobile(phone) : '', password };
      }
      console.log('  ✖ Passwords do not match, please type them again');
    }
  };

  return { ask, askHidden, askUntilValid, askPerson, close: () => rl.close() };
};

module.exports = { connectDb, createPrompter };
