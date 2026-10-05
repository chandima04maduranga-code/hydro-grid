const express = require("express");
const router = express.Router();
const { recordTelemetry, getSensors } = require("../controllers/sensorController");

// Public endpoint for IoT hardware
router.post("/telemetry", recordTelemetry);

// Protected endpoint for the React frontend (assuming you have auth middleware)
// router.get("/", authMiddleware, getSensors); 
router.get("/", getSensors); 

module.exports = router;