import { Bubbles, Cloud, Droplets, FlaskConical, Sprout, Sun, Thermometer, ThermometerSun, Waves, Zap } from "lucide-react";

// Display details for each sensor metric (names come from i18n "metrics.*")
export const METRIC_META = {
  waterTemp: { icon: Thermometer, decimals: 1, group: "water" },
  ph: { icon: FlaskConical, decimals: 2, group: "water" },
  ec: { icon: Zap, decimals: 2, group: "water" },
  dissolvedOxygen: { icon: Bubbles, decimals: 1, group: "water" },
  waterLevel: { icon: Waves, decimals: 0, group: "water" },
  airTemp: { icon: ThermometerSun, decimals: 1, group: "climate" },
  humidity: { icon: Droplets, decimals: 0, group: "climate" },
  light: { icon: Sun, decimals: 0, group: "climate" },
  co2: { icon: Cloud, decimals: 0, group: "climate" },
  substrateMoisture: { icon: Sprout, decimals: 0, group: "root" }
};

export const METRIC_ORDER = Object.keys(METRIC_META);
export const METRIC_GROUPS = ["water", "climate", "root"];

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
  good: { chip: "bg-leaf-50 text-leaf-700 ring-leaf-500/25", icon: "bg-leaf-50 text-leaf-600", value: "text-gray-900", border: "border-leaf-500/20" },
  warning: { chip: "bg-gold-100 text-gold-600 ring-gold-400/40", icon: "bg-gold-100 text-gold-600", value: "text-gold-600", border: "border-gold-400/50" },
  critical: { chip: "bg-red-50 text-red-700 ring-red-400/40", icon: "bg-red-50 text-red-600", value: "text-red-600", border: "border-red-400/60" },
  muted: { chip: "bg-gray-100 text-gray-500 ring-gray-200", icon: "bg-gray-100 text-gray-400", value: "text-gray-400", border: "border-gray-200" }
};

export const healthLevel = (score) => (score >= 80 ? "good" : score >= 50 ? "fair" : "poor");
