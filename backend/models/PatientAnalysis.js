const mongoose = require('mongoose');

const patientAnalysisSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now
  },
  age: Number,
  gender: String,
  pWaveDuration: Number,
  prInterval: Number,
  qrsDuration: Number,
  stSegment: Number,
  hrvSdnn: Number,
  prSegment: Number,
  stSlope: Number,
  riskScore: Number,
  prediction: String
});

module.exports = mongoose.model('PatientAnalysis', patientAnalysisSchema);
