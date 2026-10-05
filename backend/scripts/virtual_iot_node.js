const axios = require("axios");

const SERVER_URL = "http://localhost:5000/api/sensors/telemetry";
const HARDWARE_ID = "NODE_AGRI_01";
const LOCATION = "Sector 4 - Alpha Field";

// Function to generate and send realistic agricultural data
const transmitTelemetry = async () => {
  // Simulate Soil Moisture between 35.0% and 65.0%
  const moistureValue = (Math.random() * (65 - 35) + 35).toFixed(1);

  try {
    await axios.post(SERVER_URL, {
      hardwareId: HARDWARE_ID,
      type: "Soil Moisture",
      value: moistureValue,
      unit: "%",
      location: LOCATION
    });
    
    console.log(`[IoT Node ${HARDWARE_ID}] Successfully transmitted: ${moistureValue}% moisture`);
  } catch (error) {
    console.error(`[IoT Node ${HARDWARE_ID}] Transmission failed. Is the backend server running?`);
  }
};

console.log(`[IoT Node ${HARDWARE_ID}] Virtual hardware initialized. Booting telemetry stream...`);

// Execute the transmission every 5 seconds (5000 milliseconds)
setInterval(transmitTelemetry, 5000);