// Sensor metrics a Hydro_Grid node can report.
// `optimal` is the target band (null = no limit on that side).
// `margin` is how far outside the optimal band a reading becomes critical:
// one number for both sides, or [below, above].
// Crop profiles (config/crops.js) override the optimal band per crop.
// Values follow common hydroponic guidance and can be tuned per farm.
const METRICS = {
  // Nutrient solution (reservoir)
  waterTemp: { unit: '°C', group: 'water', optimal: [18, 24], margin: 5 },
  ph: { unit: 'pH', group: 'water', optimal: [5.5, 6.5], margin: 0.5 },
  ec: { unit: 'mS/cm', group: 'water', optimal: [1.0, 1.6], margin: 0.5 },
  dissolvedOxygen: { unit: 'mg/L', group: 'water', optimal: [6, null], margin: 2 },
  waterLevel: { unit: '%', group: 'water', optimal: [40, null], margin: 20 },

  // Greenhouse climate
  airTemp: { unit: '°C', group: 'climate', optimal: [18, 28], margin: 6 },
  humidity: { unit: '%', group: 'climate', optimal: [50, 75], margin: 15 },
  light: { unit: 'µmol/m²/s', group: 'climate', optimal: [200, 700], margin: [120, 400], daytimeOnly: true },
  co2: { unit: 'ppm', group: 'climate', optimal: [400, 1200], margin: [100, 800] },

  // Root zone (grow bags / coco peat)
  substrateMoisture: { unit: '%', group: 'root', optimal: [40, 70], margin: 15 }
};

const METRIC_IDS = Object.keys(METRICS);

// Daylight hours (Sri Lanka time) during which light levels are judged
const DAYLIGHT_HOURS = [7, 18];

module.exports = { METRICS, METRIC_IDS, DAYLIGHT_HOURS };
