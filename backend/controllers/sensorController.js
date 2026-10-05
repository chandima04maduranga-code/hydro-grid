const Sensor = require("../models/Sensor");

// Handle incoming hardware telemetry
exports.recordTelemetry = async (req, res) => {
  try {
    const { hardwareId, type, value, unit, location } = req.body;

    // Upsert: Update the sensor if it exists, or create it if it is new hardware
    const sensor = await Sensor.findOneAndUpdate(
      { hardwareId },
      { type, value, unit, location, lastUpdated: Date.now() },
      { new: true, upsert: true }
    );

    res.status(200).json({ msg: "Telemetry recorded", data: sensor });
  } catch (err) {
    console.error("Telemetry Error:", err.message);
    res.status(500).send("Server Error");
  }
};

// Get all sensors for the frontend dashboard
exports.getSensors = async (req, res) => {
  try {
    const sensors = await Sensor.find().sort({ lastUpdated: -1 });
    res.status(200).json(sensors);
  } catch (err) {
    res.status(500).send("Server Error");
  }
};