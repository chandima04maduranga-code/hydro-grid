// Advisory engine: compares sensor readings with the target bands for the
// node's crop and turns problems into issue codes (e.g. "ph.high") that the
// UI translates into plain-language advice and step-by-step actions.
const { METRICS, DAYLIGHT_HOURS } = require('../config/metrics');
const { CROPS, DEFAULT_CROP } = require('../config/crops');

// Readings older than this are shown as stale instead of being judged
const STALE_AFTER_MS = 10 * 60 * 1000;

const HEALTH_PENALTY = { warning: 8, critical: 20 };

const colomboHour = (date) =>
  Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Colombo', hour: 'numeric', hour12: false }).format(date));

const round = (value) => Math.round(value * 100) / 100;

// Optimal band for the crop, and the critical band = optimal widened by the margin
const rangesFor = (metric, cropId = DEFAULT_CROP) => {
  const { optimal: defaultBand, margin } = METRICS[metric];
  const optimal = CROPS[cropId]?.[metric] || defaultBand;
  const [below, above] = Array.isArray(margin) ? margin : [margin, margin];
  const [low, high] = optimal;

  return {
    optimal,
    critical: [low === null ? null : round(low - below), high === null ? null : round(high + above)]
  };
};

// Judges one reading: status optimal / low / high, or inactive (light at night) / stale
const evaluateReading = (metric, reading, { cropId, now = new Date() } = {}) => {
  const { optimal, critical } = rangesFor(metric, cropId);
  const result = { metric, value: reading.value, unit: METRICS[metric].unit, recordedAt: reading.recordedAt, optimal, status: 'optimal', severity: null };

  if (now - new Date(reading.recordedAt) > STALE_AFTER_MS) return { ...result, status: 'stale' };

  if (METRICS[metric].daytimeOnly) {
    const hour = colomboHour(now);
    if (hour < DAYLIGHT_HOURS[0] || hour >= DAYLIGHT_HOURS[1]) return { ...result, status: 'inactive' };
  }

  const [optLow, optHigh] = optimal;
  const [critLow, critHigh] = critical;
  if (optLow !== null && reading.value < optLow) {
    return { ...result, status: 'low', severity: critLow !== null && reading.value < critLow ? 'critical' : 'warning' };
  }
  if (optHigh !== null && reading.value > optHigh) {
    return { ...result, status: 'high', severity: critHigh !== null && reading.value > critHigh ? 'critical' : 'warning' };
  }
  return result;
};

// Judges every latest reading of a node and summarises the problems
const assessNode = (node, now = new Date()) => {
  const metrics = {};
  const issues = [];

  for (const [metric, reading] of Object.entries(node.latest || {})) {
    if (!METRICS[metric]) continue;
    const evaluation = evaluateReading(metric, reading, { cropId: node.cropProfile, now });
    metrics[metric] = evaluation;
    if (evaluation.severity) {
      issues.push({
        code: `${metric}.${evaluation.status}`,
        metric,
        direction: evaluation.status,
        severity: evaluation.severity,
        value: evaluation.value,
        unit: evaluation.unit,
        optimal: evaluation.optimal
      });
    }
  }

  issues.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === 'critical' ? -1 : 1));
  const penalty = issues.reduce((sum, issue) => sum + HEALTH_PENALTY[issue.severity], 0);

  return { metrics, issues, healthScore: Math.max(0, 100 - penalty) };
};

module.exports = { rangesFor, evaluateReading, assessNode, STALE_AFTER_MS };
