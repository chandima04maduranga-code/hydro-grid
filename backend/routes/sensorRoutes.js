const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { recordTelemetry, getSensors } = require("../controllers/sensorController");

// Public endpoint for IoT hardware (device API keys come with security hardening)
router.post("/telemetry", recordTelemetry);

// Protected endpoint for the React frontend
router.get("/", auth, getSensors);

module.exports = router;
