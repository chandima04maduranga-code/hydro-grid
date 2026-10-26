const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Sri Lankan mobile numbers: 07XXXXXXXX or +947XXXXXXXX
const LK_MOBILE_PATTERN = /^(?:\+94|0)7\d{8}$/;

const MIN_PASSWORD_LENGTH = 8;

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

const isValidEmail = (value) => isNonEmptyString(value) && EMAIL_PATTERN.test(value.trim());

const isValidLkMobile = (value) => LK_MOBILE_PATTERN.test(String(value).replace(/[\s-]/g, ''));

// Normalises a Sri Lankan mobile number to +94 format
const normaliseLkMobile = (value) => {
  const digits = String(value).replace(/[\s-]/g, '');
  return digits.startsWith('0') ? `+94${digits.slice(1)}` : digits;
};

// Password must have at least 8 characters, a letter and a number
const isStrongPassword = (value) =>
  typeof value === 'string' &&
  value.length >= MIN_PASSWORD_LENGTH &&
  /[A-Za-z]/.test(value) &&
  /\d/.test(value);

module.exports = {
  MIN_PASSWORD_LENGTH,
  isNonEmptyString,
  isValidEmail,
  isValidLkMobile,
  normaliseLkMobile,
  isStrongPassword
};
