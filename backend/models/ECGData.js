const mongoose = require('mongoose');

const ecgDataSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now
  },
  samples: {
    type: [Number],
    default: undefined
  },
  sensorValue: {
    type: Number
  },
  loPlus: {
    type: Boolean,
    default: false
  },
  loMinus: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('ECGData', ecgDataSchema);
