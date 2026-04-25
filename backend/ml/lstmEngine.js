const tf = require('@tensorflow/tfjs');

// 1. Define the Stacked Multivariate LSTM Architecture
let model;

const initModel = async () => {
    model = tf.sequential();

    // LSTM Layer 1 (Stacked, must return sequences)
    // Input shape: [timesteps, features]. Here we treat the current set of manual inputs as 1 timestep with 8 features.
    model.add(tf.layers.lstm({
        units: 32,
        returnSequences: true, 
        inputShape: [1, 8] // 1 sequence step, 8 multivariate features
    }));

    // Dropout for regularization
    model.add(tf.layers.dropout({ rate: 0.2 }));

    // LSTM Layer 2
    model.add(tf.layers.lstm({
        units: 16,
        returnSequences: false
    }));

    // Dense Output Layer predicting risk probability (0 to 1)
    model.add(tf.layers.dense({
        units: 1,
        activation: 'sigmoid'
    }));

    model.compile({
        optimizer: 'adam',
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
    });

    console.log('Stacked Multivariate LSTM initialized.');
};

// 2. Format incoming features into Multivariate Tensor Shape
const executeLSTM = async (features) => {
    if (!model) {
        await initModel();
    }

    // Multivariate Array (Age + 7 ECG Parameters)
    const rawFeatures = [
        features.age || 0,
        features.pWaveDuration || 0,
        features.prInterval || 0,
        features.qrsDuration || 0,
        features.stSegment || 0,
        features.hrvSdnn || 0,
        features.prSegment || 0,
        features.stSlope || 0
    ];

    // In a real environment, you MUST normalize (MinMax or Standard Scaler) your features before feeding into LSTM.
    // For this example, we apply a mock crude normalization so values don't explode the sigmoid curve.
    const normalizedFeatures = rawFeatures.map(val => val / 300);

    // Reshape to [batch_size, timesteps, features] -> [1, 1, 8]
    const inputTensor = tf.tensor3d(normalizedFeatures, [1, 1, 8]);

    // 3. Make Prediction
    const predictionTensor = model.predict(inputTensor);
    
    // Extract risk probability (0.0 to 1.0)
    const riskProbability = (await predictionTensor.data())[0];
    
    // Clean up tensors from memory
    inputTensor.dispose();
    predictionTensor.dispose();

    // Convert probability to percentage score (0-100)
    const score = +(riskProbability * 100).toFixed(1);

    // Assess Tier
    let prediction = "LOW RISK";
    if (score > 75) prediction = "HIGH RISK";
    else if (score > 40) prediction = "BORDERLINE";

    return { score, prediction };
};

module.exports = {
    initModel,
    executeLSTM
};
