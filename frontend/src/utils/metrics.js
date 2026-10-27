import { Bubbles, Cloud, Droplets, FlaskConical, Gauge, Sprout, Sun, Thermometer, ThermometerSun, Waves, Zap } from "lucide-react";

// Display details for each sensor metric (names come from i18n "metrics.*")
export const METRIC_META = {
  waterTemp: { icon: Thermometer, decimals: 1, group: "water" },
  ph: { icon: FlaskConical, decimals: 2, group: "water" },
  ec: { icon: Zap, decimals: 2, group: "water" },
  dissolvedOxygen: { icon: Bubbles, decimals: 1, group: "water" },
  waterLevel: { icon: Waves, decimals: 0, group: "water" },
  flowRate: { icon: Gauge, decimals: 1, group: "water" },
  airTemp: { icon: ThermometerSun, decimals: 1, group: "climate" },
  humidity: { icon: Droplets, decimals: 0, group: "climate" },
  light: { icon: Sun, decimals: 0, group: "climate" },
  co2: { icon: Cloud, decimals: 0, group: "climate" },
  substrateMoisture: { icon: Sprout, decimals: 0, group: "root" }
};

export const METRIC_ORDER = Object.keys(METRIC_META);
export const METRIC_GROUPS = ["water", "climate", "root"];

// Each part of the hydroponic system has its own colour on the dashboard
export const GROUP_STYLES = {
  water: { icon: Droplets, panel: "bg-sky-50 ring-sky-100", badge: "bg-sky-100 text-sky-700", title: "text-sky-800" },
  climate: { icon: ThermometerSun, panel: "bg-orange-50 ring-orange-100", badge: "bg-orange-100 text-orange-700", title: "text-orange-800" },
  root: { icon: Sprout, panel: "bg-lime-50 ring-lime-100", badge: "bg-lime-100 text-lime-700", title: "text-lime-800" }
};

export const formatMetricValue = (metric, value) =>
  value === undefined || value === null ? "—" : Number(value).toFixed(METRIC_META[metric]?.decimals ?? 1);

// "5.5 – 6.5 pH", "above 40 %", "below 75 %"
export const formatRange = (t, metric, [min, max], unit) => {
  const fmt = (value) => formatMetricValue(metric, value);
  const range = min !== null && max !== null
    ? t("telemetry.rangeBetween", { min: fmt(min), max: fmt(max) })
    : min !== null
      ? t("telemetry.rangeAbove", { min: fmt(min) })
      : t("telemetry.rangeBelow", { max: fmt(max) });
  return `${range} ${unit}`;
};

// Colours per reading state: severity wins, otherwise the status
export const toneFor = (evaluation) => {
  if (evaluation?.severity === "critical") return "critical";
  if (evaluation?.severity === "warning") return "warning";
  if (evaluation?.status === "optimal") return "good";
  return "muted";
};

export const TONE_STYLES = {
  good: { dot: "bg-emerald-500", text: "text-gray-500", value: "text-gray-900", chip: "bg-emerald-100 text-emerald-800", marker: "bg-emerald-600" },
  warning: { dot: "bg-amber-500", text: "text-amber-700", value: "text-amber-700", chip: "bg-amber-100 text-amber-800", marker: "bg-amber-500" },
  critical: { dot: "bg-red-600", text: "text-red-700", value: "text-red-700", chip: "bg-red-100 text-red-800", marker: "bg-red-600" },
  muted: { dot: "bg-gray-300", text: "text-gray-400", value: "text-gray-400", chip: "bg-gray-100 text-gray-500", marker: "bg-gray-400" }
};

// Where the value and the target band sit on a 0–100 % scale for a gauge bar.
// The scale runs a little past the target band on both sides.
export const gaugeScale = (value, [low, high]) => {
  const span = low !== null && high !== null ? high - low : Math.abs(low ?? high ?? value) * 0.5 || 1;
  const min = Math.min((low ?? (high - span * 2)) - span * 0.6, value);
  const max = Math.max((high ?? (low + span * 2)) + span * 0.6, value);
  const position = (number) => ((number - min) / (max - min)) * 100;
  return {
    band: [low === null ? 0 : position(low), high === null ? 100 : position(high)],
    marker: Math.min(100, Math.max(0, position(value)))
  };
};

export const healthLevel = (score) => (score >= 80 ? "good" : score >= 50 ? "fair" : "poor");

export const HEALTH_COLORS = {
  good: { text: "text-emerald-700", stroke: "#059669", tint: "bg-emerald-50 ring-emerald-100" },
  fair: { text: "text-amber-700", stroke: "#d97706", tint: "bg-amber-50 ring-amber-100" },
  poor: { text: "text-red-700", stroke: "#dc2626", tint: "bg-red-50 ring-red-100" }
};
