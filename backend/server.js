require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');

const ECGData = require('./models/ECGData');
const PatientAnalysis = require('./models/PatientAnalysis');
const { initModel, executeLSTM } = require('./ml/lstmEngine');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chagas_ecg')
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Could not connect to MongoDB', err));

// --- ESP32 HARDWARE ROUTES ---

// Endpoint for ESP32 to send a batch of raw ECG samples
app.post('/api/ecg-raw', async (req, res) => {
  try {
    const { samples } = req.body;

    if (!samples || !Array.isArray(samples) || samples.length === 0) {
      return res.status(400).json({ success: false, error: 'Must provide a non-empty samples array' });
    }

    // 1. Persist the raw batch
    const record = new ECGData({ samples });
    await record.save();

    // 2. Extract ECG features via Python signal processor
    const pythonResult = await runECGProcessing(samples);
    const features = pythonResult.extracted_features;

    // 3. Run LSTM risk analysis on extracted features
    const { score, prediction } = await executeLSTM(features);

    // 4. Persist the analysis result (non-blocking on DB failure)
    const analysisRecord = new PatientAnalysis({
      ...features,
      riskScore: score,
      prediction
    });
    try {
      await analysisRecord.save();
    } catch (dbError) {
      console.error('Warning: Failed to save analysis record:', dbError.message);
    }

    res.status(200).json({
      success: true,
      analysis: {
        score,
        prediction,
        heartRate: pythonResult.heart_rate,
        rPeaksDetected: pythonResult.R_peaks.length,
        features
      }
    });
  } catch (error) {
    console.error('Error processing ECG batch:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});


// --- FRONTEND ROUTES ---

// Executes the Python ECG Processor pipeline via child_process
function runECGProcessing(ecgArray) {
  return new Promise((resolve, reject) => {
    // Note: Use 'python' or 'python3' depending on your Windows setup
    const py = spawn('python3', [path.join(__dirname, 'ml', 'ecg_processor.py')]);

    let result = '';

    py.stdin.write(JSON.stringify(ecgArray));
    py.stdin.end();

    py.stdout.on('data', (data) => {
      result += data.toString();
    });

    py.stderr.on('data', (err) => {
      console.error('Python error:', err.toString());
    });

    py.on('close', (code) => {
      if (code !== 0) {
         return reject(new Error(`Python script exited with code ${code}`));
      }
      try {
        resolve(JSON.parse(result));
      } catch (e) {
        reject(new Error("Failed to parse Python output: " + result));
      }
    });
  });
}

// Endpoint to process raw ECG waveforms and extract features via Python
app.post('/api/extract-features', async (req, res) => {
  try {
    const rawEcgData = req.body.ecgData;
    if (!rawEcgData || !Array.isArray(rawEcgData)) {
      return res.status(400).json({ success: false, error: 'Must provide an array of ecgData' });
    }

    const pythonResult = await runECGProcessing(rawEcgData);
    
    res.status(200).json({
      success: true,
      data: pythonResult
    });
  } catch (error) {
    console.error('Error extracting features via Python:', error.message);
    res.status(500).json({ success: false, error: 'Error communicating with Python signal processing layer.' });
  }
});

// Endpoint to submit analysis parameters from Frontend
app.post('/api/analyze', async (req, res) => {
  try {
    const data = req.body;
    
    // Process parameters through Stacked Multivariate LSTM
    const { score, prediction } = await executeLSTM(data);
    
    const analysisRecord = new PatientAnalysis({
      ...data,
      riskScore: score,
      prediction: prediction
    });

    try {
      await analysisRecord.save();
      console.log('Saved analysis record to database.');
    } catch (dbError) {
      console.error('Warning: Failed to save record to MongoDB. Make sure your IP is whitelisted in Atlas. Continuing to return prediction.', dbError.message);
    }
    
    res.status(200).json({
      success: true,
      result: {
        score,
        prediction,
        message: 'Analysis completed'
      }
    });

  } catch (error) {
    console.error('Error running analysis:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint to get recent analyses
app.get('/api/analyses', async (req, res) => {
  try {
    const recent = await PatientAnalysis.find().sort({ timestamp: -1 }).limit(10);
    res.status(200).json(recent);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});


app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  // Pre-initialize LSTM model on startup
  try {
      await initModel();
  } catch(e) {
      console.error("Failed to initialize LSTM:", e);
  }
});
