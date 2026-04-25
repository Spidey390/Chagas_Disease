require('dotenv').config();
const mongoose = require('mongoose');

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB successfully for test!");
    
    const PatientAnalysis = require('./models/PatientAnalysis');
    const docs = await PatientAnalysis.find().sort({ timestamp: -1 }).limit(5);
    
    console.log("Documents in PatientAnalysis:", docs.length);
    if (docs.length > 0) {
      console.log("Latest doc:", docs[0]);
    }
    
    const ECGData = require('./models/ECGData');
    const ecg = await ECGData.find().limit(2);
    console.log("ECG Data count:", ecg.length);
    
    process.exit(0);
  } catch (err) {
    console.error("DB Check Error:", err);
    process.exit(1);
  }
}
check();
