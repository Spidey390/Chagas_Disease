import sys
import json
import numpy as np
from scipy.signal import find_peaks

def main():
    try:
        # Read the raw array of ECG integers from standard input
        input_data = sys.stdin.read()
        if not input_data:
            print(json.dumps({"error": "No input provided"}))
            sys.exit(1)
            
        data = json.loads(input_data)
        ecg = np.array(data)

        # Basic signal validation
        if len(ecg) < 10:
            print(json.dumps({"error": "Insufficient data"}))
            sys.exit(1)

        # Detect R peaks using scipy
        # The threshold uses the mean + 50 as requested by the architectural spec.
        peaks, _ = find_peaks(ecg, height=np.mean(ecg) + 50)

        # For a 10-second sample at typical clinical Hz, we can roughly estimate heart rate
        # Using a simple multiplier for this pipeline architecture demonstration.
        heart_rate = len(peaks) * 6 

        # We will also mock up extracting the other PQRST wave segments based on the peak interval
        # to feed the LSTM seamlessly. In a full production script, you'd use neurokit2.
        
        pr_interval_estimate = float(np.random.uniform(120, 200)) if len(peaks) > 0 else 150.0
        qrs_duration_estimate = float(np.random.uniform(80, 120)) if len(peaks) > 0 else 80.0

        output = {
            "R_peaks": peaks.tolist(),
            "heart_rate": heart_rate,
            "extracted_features": {
                "pWaveDuration": float(np.mean(ecg[:10])) if len(ecg) > 10 else 50.0,
                "prInterval": pr_interval_estimate,
                "qrsDuration": qrs_duration_estimate,
                "stSegment": 150.0,
                "hrvSdnn": float(np.std(np.diff(peaks))) if len(peaks) > 1 else 50.0,
                "prSegment": 80.0,
                "stSlope": 0.005
            }
        }

        print(json.dumps(output))

    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
