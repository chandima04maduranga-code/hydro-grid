const mongoose = require('mongoose');

const PlantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  species: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String, required: true },
  optimalTemperature: { type: Number, required: true },
  optimalMoisture: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Plant', PlantSchema);