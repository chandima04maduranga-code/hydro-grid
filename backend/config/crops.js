// Crop profiles: target bands that differ from the defaults in config/metrics.js.
// Only the optimal band is given; the critical band is derived from it
// (see services/advisor.js). General hydroponic guidance, tune per farm.
const CROPS = {
  lettuce: { ph: [5.5, 6.5], ec: [0.8, 1.2], airTemp: [16, 24] },
  tomato: { ph: [5.5, 6.5], ec: [2.0, 3.5], airTemp: [18, 29] },
  strawberry: { ph: [5.5, 6.2], ec: [1.0, 1.5], airTemp: [15, 26] },
  bellPepper: { ph: [5.8, 6.3], ec: [1.8, 2.8], airTemp: [18, 29] },
  cucumber: { ph: [5.5, 6.0], ec: [1.7, 2.5], airTemp: [20, 30] },
  // Local leafy greens: kankun, gotukola, mukunuwenna
  leafyGreens: { ph: [5.5, 6.5], ec: [1.0, 1.6], airTemp: [20, 32] }
};

const CROP_IDS = Object.keys(CROPS);
const DEFAULT_CROP = 'lettuce';

module.exports = { CROPS, CROP_IDS, DEFAULT_CROP };
