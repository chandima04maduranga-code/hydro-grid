const axios = require("axios");

// Usage: npm run simulate -- <companyId> [hardwareId] [location]
// or set SIM_COMPANY_ID / SIM_HARDWARE_ID / SIM_LOCATION
const COMPANY_ID = process.argv[2] || process.env.SIM_COMPANY_ID;
const HARDWARE_ID = process.argv[3] || process.env.SIM_HARDWARE_ID || "NODE_AGRI_01";
const LOCATION = process.argv[4] || process.env.SIM_LOCATION || "Sector 4 - Alpha Field";
const SERVER_URL = process.env.SIM_SERVER_URL || "http://localhost:5000/api/sensors/telemetry";

if (!COMPANY_ID) {
  console.error("❌ Missing company id. Usage: npm run simulate -- <companyId> [hardwareId] [location]");
  process.exit(1);
}

// Function to generate and send realistic agricultural data
const transmitTelemetry = async () => {
  // Simulate Soil Moisture between 35.0% and 65.0%
  const moistureValue = (Math.random() * (65 - 35) + 35).toFixed(1);

  try {
    await axios.post(SERVER_URL, {
      companyId: COMPANY_ID,
      hardwareId: HARDWARE_ID,
      type: "Soil Moisture",
      value: moistureValue,
      unit: "%",
      location: LOCATION
    });

    console.log(`[IoT Node ${HARDWARE_ID}] Successfully transmitted: ${moistureValue}% moisture`);
  } catch (error) {
    const reason = error.response?.data?.message || "Is the backend server running?";
    console.error(`[IoT Node ${HARDWARE_ID}] Transmission failed. ${reason}`);
  }
};

console.log(`[IoT Node ${HARDWARE_ID}] Virtual hardware initialized for company ${COMPANY_ID}. Booting telemetry stream...`);

// Execute the transmission every 5 seconds (5000 milliseconds)
setInterval(transmitTelemetry, 5000);
