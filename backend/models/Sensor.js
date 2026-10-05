const mongoose = require("mongoose");

const SensorSchema = new mongoose.Schema({
  hardwareId: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  value: { type: String, required: true },
  unit: { type: String, required: true },
  location: { type: String, required: true },
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Sensor", SensorSchema);