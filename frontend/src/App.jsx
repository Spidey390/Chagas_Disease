import React, { useState } from 'react';
import axios from 'axios';
import { Activity } from 'lucide-react';
import ManualDataEntry from './components/ManualDataEntry';
import AnalysisResults from './components/AnalysisResults';

function App() {
  const [formData, setFormData] = useState({
    age: 45,
    gender: 'Female',
    pWaveDuration: 50,
    prInterval: 150,
    qrsDuration: 80,
    stSegment: 150,
    hrvSdnn: 50,
    prSegment: 80,
    stSlope: 0.005
  });

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Send data to backend for analysis
      const response = await axios.post('http://localhost:5000/api/analyze', formData);
      setResults(response.data.result);
    } catch (error) {
      console.error('Error analyzing data:', error);
      alert('Error connecting to backend server. Make sure it is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header>
        <h1><Activity color="#e74c3c" size={32} /> Manual ECG Data Entry</h1>
      </header>

      <main>
        <ManualDataEntry
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
        />

        {loading && <p>Analyzing data...</p>}

        {results && (
          <>
            <hr />
            <AnalysisResults results={results} />
          </>
        )}
      </main>
    </div>
  );
}

export default App;
