// https://support.payhere.lk/api-&-mobile-sdk/checkout-api
const crypto = require('crypto');

const CHECKOUT_URLS = {
  sandbox: 'https://sandbox.payhere.lk/pay/checkout',
  live: 'https://www.payhere.lk/pay/checkout'
};

const STATUS_CODES = { '2': 'paid', '0': 'pending', '-1': 'cancelled', '-2': 'failed', '-3': 'chargedback' };

const settings = () => ({
  merchantId: process.env.PAYHERE_MERCHANT_ID || '',
  merchantSecret: process.env.PAYHERE_MERCHANT_SECRET || '',
  checkoutUrl: process.env.PAYHERE_SANDBOX === 'false' ? CHECKOUT_URLS.live : CHECKOUT_URLS.sandbox,
  // Must be reachable from the internet; use a tunnel when running locally
  notifyUrl: `${process.env.API_PUBLIC_URL || 'http://localhost:5000'}/api/billing/payhere/notify`,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173'
});

const isConfigured = () => {
  const { merchantId, merchantSecret } = settings();
  return Boolean(merchantId && merchantSecret);
};

const md5Upper = (text) => crypto.createHash('md5').update(text).digest('hex').toUpperCase();

const formatAmount = (amount) => Number(amount).toFixed(2);

// hash = MD5(merchant_id + order_id + amount + currency + MD5(secret)), upper case
const checkoutHash = ({ orderId, amount, currency }) => {
  const { merchantId, merchantSecret } = settings();
  return md5Upper(`${merchantId}${orderId}${formatAmount(amount)}${currency}${md5Upper(merchantSecret)}`);
};

// md5sig = MD5(merchant_id + order_id + payhere_amount + payhere_currency + status_code + MD5(secret))
const notifySignature = ({ merchantId, orderId, amount, currency, statusCode }) => {
  const { merchantSecret } = settings();
  return md5Upper(`${merchantId}${orderId}${amount}${currency}${statusCode}${md5Upper(merchantSecret)}`);
};

module.exports = { STATUS_CODES, settings, isConfigured, formatAmount, checkoutHash, notifySignature };
