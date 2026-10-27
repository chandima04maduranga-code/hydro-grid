// Virtual IoT nodes for development and demos.
// Simulates a hydroponic greenhouse on Sri Lanka time: daily temperature,
// humidity, light and CO2 cycles, slow drifts in reservoir level, pH, EC and
// grow-bag moisture, and occasional air-pump failures and blocked circulation
// pumps (no flow, so the grow bags dry out), so the dashboard's
// advice can be seen in action.
//
// Usage: npm run simulate -- <companyId> [nodes] [intervalSeconds]
//   nodes: a count (NODE_AGRI_01, NODE_AGRI_02, ...) or a list of
//          nodeId:crop pairs, e.g. NODE_01:tomato,NODE_02:lettuce
//   or set SIM_COMPANY_ID, SIM_NODES, SIM_INTERVAL_SECONDS, SIM_SERVER_URL
const axios = require("axios");
const { CROPS, DEFAULT_CROP } = require("../config/crops");
const { METRICS } = require("../config/metrics");

const COMPANY_ID = process.argv[2] || process.env.SIM_COMPANY_ID;
const NODES_ARG = String(process.argv[3] || process.env.SIM_NODES || 2);
const INTERVAL_SECONDS = Number(process.argv[4] || process.env.SIM_INTERVAL_SECONDS || 10);
const SERVER_URL = process.env.SIM_SERVER_URL || "http://localhost:5000/api/telemetry";

if (!COMPANY_ID) {
  console.error("❌ Missing company id. Usage: npm run simulate -- <companyId> [nodeCount] [intervalSeconds]");
  process.exit(1);
}

const PUMP_FAILURE_CHANCE = 0.01; // per reading
const PUMP_FAILURE_TICKS = 20;
const CLOG_CHANCE = 0.01; // per reading
const CLOG_TICKS = 15;

const noise = (spread) => (Math.random() - 0.5) * 2 * spread;
const round = (value, decimals) => Number(value.toFixed(decimals));
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

// Hour of day in Sri Lanka as a fraction, e.g. 13.5 = 1:30 PM
const colomboHour = () => {
  const [hour, minute] = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Colombo", hour: "numeric", minute: "numeric", hour12: false })
    .format(new Date())
    .split(":")
    .map(Number);
  return hour + minute / 60;
};

// 0 at 6 AM and 6 PM, 1 at noon; nights cool down less than days warm up
const dayCurve = (hour) => {
  const curve = Math.sin(((hour - 6) / 12) * Math.PI);
  return curve > 0 ? curve : curve * 0.4;
};

// Nutrient strength (EC) band for the node's crop
const ecBandFor = (crop) => CROPS[crop]?.ec || METRICS.ec.optimal;

const createNode = (index, nodeId, crop = DEFAULT_CROP) => {
  const [low, high] = ecBandFor(crop);
  return {
    nodeId,
    crop,
    location: `Greenhouse bay ${index + 1}`,
    waterLevel: 70 + Math.random() * 25,
    ph: 5.8 + Math.random() * 0.4,
    ec: low + (high - low) * (0.5 + Math.random() * 0.4),
    substrateMoisture: 55 + Math.random() * 10,
    pumpFailureTicks: 0,
    clogTicks: 0
  };
};

// "3" → NODE_AGRI_01..03; "NODE_01:tomato,NODE_02" → named nodes with crops
const parseNodes = (arg) => {
  if (/^\d+$/.test(arg)) {
    return Array.from({ length: Number(arg) }, (_, index) => createNode(index, `NODE_AGRI_${String(index + 1).padStart(2, "0")}`));
  }
  return arg.split(",").map((part, index) => {
    const [nodeId, crop] = part.trim().split(":");
    if (crop && !CROPS[crop]) {
      console.error(`❌ Unknown crop "${crop}". Use one of: ${Object.keys(CROPS).join(", ")}`);
      process.exit(1);
    }
    return createNode(index, nodeId, crop);
  });
};

// Advances one node by one reading and returns the values to send
const step = (node) => {
  const hour = colomboHour();
  const day = dayCurve(hour);
  const daylight = Math.max(0, day);

  // Drifts the farmer has to act on (sped up so demos show advice within
  // minutes); the simulator "fixes" them itself at the extremes
  node.waterLevel -= 0.25 + Math.random() * 0.15;
  if (node.waterLevel < 12) node.waterLevel = 92; // reservoir topped up
  node.ph += 0.004 + noise(0.003);
  if (node.ph > 7.3) node.ph = 5.8; // pH down dosed
  const [ecLow, ecHigh] = ecBandFor(node.crop);
  node.ec -= (ecHigh - ecLow) * (0.005 + noise(0.004));
  if (node.ec < ecLow * 0.75) node.ec = ecHigh * 0.95; // nutrients added
  if (node.clogTicks > 0) node.clogTicks -= 1;
  else if (Math.random() < CLOG_CHANCE) node.clogTicks = CLOG_TICKS;
  const clogged = node.clogTicks > 0;

  // With no flow the grow bags dry out much faster
  node.substrateMoisture -= (0.15 + daylight * 0.2) * (clogged ? 4 : 1);
  if (!clogged && node.substrateMoisture < 32) node.substrateMoisture = 68; // irrigation cycle
  node.substrateMoisture = Math.max(8, node.substrateMoisture);

  if (node.pumpFailureTicks > 0) node.pumpFailureTicks -= 1;
  else if (Math.random() < PUMP_FAILURE_CHANCE) node.pumpFailureTicks = PUMP_FAILURE_TICKS;

  const airTemp = 22 + day * 7 + noise(0.6);
  const waterTemp = 20.5 + day * 4 + noise(0.3);
  const oxygen = node.pumpFailureTicks > 0 ? 3.2 + noise(0.4) : 8.6 - (waterTemp - 18) * 0.18 + noise(0.2);

  return {
    waterTemp: round(waterTemp, 1),
    ph: round(node.ph, 2),
    ec: round(node.ec, 2),
    dissolvedOxygen: round(oxygen, 1),
    waterLevel: round(node.waterLevel, 0),
    flowRate: round(clogged ? 0.2 + Math.random() * 0.3 : 2.4 + noise(0.3), 1),
    airTemp: round(airTemp, 1),
    humidity: round(clamp(76 - day * 20 + noise(2), 30, 98), 0),
    light: round(daylight * (620 + noise(120)), 0),
    co2: round(day > 0 ? 450 + noise(40) : 720 + noise(60), 0),
    substrateMoisture: round(node.substrateMoisture, 0)
  };
};

const nodes = parseNodes(NODES_ARG);

const transmit = async (node) => {
  const readings = step(node);
  try {
    await axios.post(SERVER_URL, { companyId: COMPANY_ID, nodeId: node.nodeId, location: node.location, readings });
    const pump = (node.pumpFailureTicks > 0 ? " ⚠ air pump failure" : "") + (node.clogTicks > 0 ? " ⚠ circulation pump blocked" : "");
    console.log(`[${node.nodeId}] pH ${readings.ph} · EC ${readings.ec} · water ${readings.waterLevel}% · flow ${readings.flowRate} L/min · DO ${readings.dissolvedOxygen} mg/L · air ${readings.airTemp}°C${pump}`);
  } catch (error) {
    const reason = error.response?.data?.message || "Is the backend server running?";
    console.error(`[${node.nodeId}] Transmission failed. ${reason}`);
  }
};

console.log(`Starting ${nodes.length} virtual node(s) [${nodes.map((node) => `${node.nodeId}:${node.crop}`).join(", ")}] for company ${COMPANY_ID}, every ${INTERVAL_SECONDS}s → ${SERVER_URL}`);
const tick = () => Promise.all(nodes.map(transmit));
tick();
setInterval(tick, INTERVAL_SECONDS * 1000);
