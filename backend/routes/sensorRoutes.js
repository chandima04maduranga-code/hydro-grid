const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const requireCompanyUser = require("../middleware/requireCompanyUser");
const { recordTelemetry, getSensors } = require("../controllers/sensorController");

// Public endpoint for IoT hardware (device API keys come with security hardening)
router.post("/telemetry", recordTelemetry);

// Protected endpoint for the React frontend
router.get("/", auth, requireCompanyUser, getSensors);

module.exports = router;
