import React from 'react';
import GaugeChart from 'react-gauge-chart';
import { Stethoscope, ClipboardList, AlertTriangle } from 'lucide-react';

export default function AnalysisResults({ results }) {
  if (!results) return null;

  const { score, prediction } = results;

  let riskClass = 'low-risk';
  let message = 'This patient shows patterns suggestive of normal cardiac function.';
  
  if (prediction === 'HIGH RISK') {
    riskClass = 'high-risk';
    message = 'This patient shows patterns suggestive of Chagas disease. Clinical evaluation is strongly recommended.';
  } else if (prediction === 'BORDERLINE') {
    riskClass = 'borderline';
    message = 'Borderline patterns detected. Monitor patient and consider further testing.';
  }

  return (
    <>
      <h2><Stethoscope size={24} /> Patient Analysis Results</h2>
      
      <div className="results-container">
        {/* Left Side: Alert */}
        <div className={`risk-alert ${riskClass}`}>
          <div className="risk-title">
            {prediction === 'HIGH RISK' && <AlertTriangle size={28} />}
            {prediction}
          </div>
          <div className="risk-score-value">{score.toFixed(1)}%</div>
          <p className="risk-desc">{message}</p>
        </div>

        {/* Right Side: Gauge Chart */}
        <div className="card gauge-container">
          <GaugeChart 
            id="gauge-chart" 
            nrOfLevels={3} 
            colors={["#28a745", "#f39c12", "#ff4d4f"]} 
            arcWidth={0.2} 
            percent={score / 100} 
            textColor="#333333"
            formatTextValue={value => value + '%'}
            style={{ width: '80%' }}
          />
          <h3 style={{ marginTop: '1rem', color: '#666', fontSize: '1rem' }}>Chagas Risk Score (%)</h3>
        </div>
      </div>

      <div className="card" style={{ marginTop: '2rem' }}>
        <h2><ClipboardList size={22} /> LSTM Model Analysis</h2>
        <ul className="list-analysis">
          <li>• <strong>Model Prediction:</strong> {score.toFixed(1)}% risk score</li>
          <li>• <strong>Model Validation Accuracy:</strong> 99.7%</li>
          <li>• <strong>Recommendation:</strong> {
            prediction === 'HIGH RISK' ? 'Immediate cardiology referral' :
            prediction === 'BORDERLINE' ? 'Schedule follow-up ECG' : 'No immediate action required'
          }</li>
        </ul>
      </div>
    </>
  );
}
