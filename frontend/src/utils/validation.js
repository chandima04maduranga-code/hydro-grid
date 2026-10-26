// Mirrors backend/utils/validators.js so users get instant feedback.
// The server still validates everything.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LK_MOBILE_PATTERN = /^(?:\+94|0)7\d{8}$/;

export const isValidEmail = (value) => EMAIL_PATTERN.test(value.trim());

export const isValidLkMobile = (value) => LK_MOBILE_PATTERN.test(value.replace(/[\s-]/g, ""));

export const isStrongPassword = (value) =>
  value.length >= 8 && /[A-Za-z]/.test(value) && /\d/.test(value);

// Returns { field: errorCode } for the registration form
export const validateRegistration = ({ name, email, phone, password, confirm }) => {
  const errors = {};
  if (!name.trim()) errors.name = "REQUIRED";
  if (!isValidEmail(email)) errors.email = "INVALID_EMAIL";
  if (phone.trim() && !isValidLkMobile(phone)) errors.phone = "INVALID_PHONE";
  if (!isStrongPassword(password)) errors.password = "WEAK_PASSWORD";
  if (confirm !== password) errors.confirm = "MISMATCH";
  return errors;
};
