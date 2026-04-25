import React from 'react';
import { RefreshCw, CheckSquare, AlertTriangle } from 'lucide-react';

const NumberInput = ({ label, value, onChange, min, max, step }) => {
  const handleDecrement = () => onChange(Math.max(min, Number(value) - step));
  const handleIncrement = () => onChange(Math.min(max, Number(value) + step));

  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div className="input-wrapper">
        <input 
          type="number" 
          className="form-input" 
          value={value} 
          onChange={(e) => onChange(Number(e.target.value))}
          step={step}
          min={min}
          max={max}
        />
        <button type="button" className="input-btn" onClick={handleDecrement}>-</button>
        <button type="button" className="input-btn" onClick={handleIncrement}>+</button>
      </div>
    </div>
  );
};

export default function ManualDataEntry({ formData, setFormData, onSubmit }) {
  
  const handleLoadExample = (type) => {
    if (type === 'high') {
      setFormData({
        age: 65, gender: 'Male', pWaveDuration: 120, prInterval: 210, qrsDuration: 110,
        stSegment: 120, hrvSdnn: 30, prSegment: 90, stSlope: 0.005
      });
    } else if (type === 'low') {
      setFormData({
        age: 35, gender: 'Female', pWaveDuration: 80, prInterval: 140, qrsDuration: 85,
        stSegment: 80, hrvSdnn: 60, prSegment: 60, stSlope: 0.001
      });
    } else if (type === 'borderline') {
      setFormData({
        age: 50, gender: 'Male', pWaveDuration: 105, prInterval: 170, qrsDuration: 95,
        stSegment: 100, hrvSdnn: 45, prSegment: 75, stSlope: 0.003
      });
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="card">
      <div className="button-group">
        <button className="btn btn-primary" onClick={() => handleLoadExample('high')}>
          <RefreshCw size={18} /> High Risk Example
        </button>
        <button className="btn btn-primary" onClick={() => handleLoadExample('low')}>
          <CheckSquare size={18} /> Low Risk Example
        </button>
        <button className="btn btn-primary" onClick={() => handleLoadExample('borderline')}>
          <AlertTriangle size={18} /> Borderline Example
        </button>
      </div>

      <div className="form-grid">
        {/* Left Column */}
        <div>
          <div className="form-group">
            <label className="form-label">Age (years)</label>
            <div className="input-wrapper">
              <input type="number" className="form-input" value={formData.age} onChange={e => handleChange('age', e.target.value)} />
              <button type="button" className="input-btn" onClick={() => handleChange('age', Math.max(0, formData.age - 1))}>-</button>
              <button type="button" className="input-btn" onClick={() => handleChange('age', formData.age + 1)}>+</button>
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">Gender</label>
            <div className="input-wrapper">
              <select className="form-select" value={formData.gender} onChange={e => handleChange('gender', e.target.value)}>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
              </select>
            </div>
          </div>

          <h3>P-wave Parameters</h3>
          <NumberInput label="P-wave Duration (ms)" value={formData.pWaveDuration} onChange={v => handleChange('pWaveDuration', v)} min={0} max={200} step={5} />

          <h3>PR Interval</h3>
          <NumberInput label="PR Interval (ms)" value={formData.prInterval} onChange={v => handleChange('prInterval', v)} min={0} max={300} step={5} />

          <h3>QRS Duration</h3>
          <NumberInput label="QRS Duration (ms)" value={formData.qrsDuration} onChange={v => handleChange('qrsDuration', v)} min={0} max={200} step={5} />
        </div>

        {/* Right Column */}
        <div>
          <h3>ST Segment</h3>
          <NumberInput label="ST Segment (ms)" value={formData.stSegment} onChange={v => handleChange('stSegment', v)} min={0} max={200} step={5} />

          <h3>Heart Rate Variability</h3>
          <NumberInput label="HRV SDNN (ms)" value={formData.hrvSdnn} onChange={v => handleChange('hrvSdnn', v)} min={0} max={200} step={5} />

          <h3>PR Segment</h3>
          <NumberInput label="PR Segment (ms)" value={formData.prSegment} onChange={v => handleChange('prSegment', v)} min={0} max={200} step={5} />

          <h3>ST Slope</h3>
          <NumberInput label="ST Slope (mV/s)" value={formData.stSlope} onChange={v => handleChange('stSlope', v)} min={0} max={0.1} step={0.001} />
        </div>
      </div>

      <button className="btn btn-submit" onClick={onSubmit}>
        Run Analysis
      </button>
    </div>
  );
}
