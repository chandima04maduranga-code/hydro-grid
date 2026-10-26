// Sri Lankan formatting helpers. All times are shown in Asia/Colombo (UTC+5:30).
export const SL_TIME_ZONE = "Asia/Colombo";

const localeFor = (language) => (language === "si" ? "si-LK" : "en-LK");

export const formatDateTime = (value, language = "en") => {
  if (!value) return "—";
  return new Intl.DateTimeFormat(localeFor(language), {
    timeZone: SL_TIME_ZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
};

export const formatClock = (value, language = "en") =>
  new Intl.DateTimeFormat(localeFor(language), {
    timeZone: SL_TIME_ZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit"
  }).format(value);

// Rs. 1,250.00
export const formatLKR = (amount, language = "en") =>
  new Intl.NumberFormat(localeFor(language), {
    style: "currency",
    currency: "LKR",
    currencyDisplay: "symbol"
  }).format(amount);
