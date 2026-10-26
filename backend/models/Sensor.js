const mongoose = require("mongoose");

const SensorSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  hardwareId: { type: String, required: true },
  type: { type: String, required: true },
  value: { type: String, required: true },
  unit: { type: String, required: true },
  location: { type: String, required: true },
  lastUpdated: { type: Date, default: Date.now }
});

// A node id only has to be unique inside one company
SensorSchema.index({ company: 1, hardwareId: 1 }, { unique: true });

module.exports = mongoose.model("Sensor", SensorSchema);
