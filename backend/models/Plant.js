const mongoose = require('mongoose');

const plantSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  name: { type: String, required: true },
  species: { type: String, required: true },
  healthStatus: { type: String, default: 'Healthy' },
  cropType: { type: String, required: true },
  systemId: { type: String, required: true },
  growthStage: { type: String, required: true },
  image: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Plant', plantSchema);
