const mongoose = require("mongoose");
const Sensor = require("../models/Sensor");
const Company = require("../models/Company");

// Handle incoming hardware telemetry.
// Until device API keys arrive (security hardening), a node names its company.
exports.recordTelemetry = async (req, res) => {
  try {
    const { companyId, hardwareId, type, value, unit, location } = req.body;

    if (!mongoose.isValidObjectId(companyId) || !(await Company.exists({ _id: companyId, status: "active" }))) {
      return res.status(400).json({ code: "COMPANY_NOT_FOUND", message: "Unknown or inactive company" });
    }

    // Upsert: update the sensor if it exists, or create it if it is new hardware
    const sensor = await Sensor.findOneAndUpdate(
      { company: companyId, hardwareId },
      { type, value, unit, location, lastUpdated: Date.now() },
      { returnDocument: "after", upsert: true, runValidators: true }
    );

    res.status(200).json({ msg: "Telemetry recorded", data: sensor });
  } catch (err) {
    console.error("Telemetry Error:", err.message);
    res.status(500).json({ code: "SERVER_ERROR", message: "Something went wrong, please try again" });
  }
};

// Get the company's sensors for the dashboard
exports.getSensors = async (req, res) => {
  try {
    const sensors = await Sensor.find({ company: req.companyId }).sort({ lastUpdated: -1 });
    res.status(200).json(sensors);
  } catch (err) {
    res.status(500).json({ code: "SERVER_ERROR", message: "Something went wrong, please try again" });
  }
};
