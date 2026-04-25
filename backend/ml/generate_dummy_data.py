import pandas as pd
import numpy as np
import os

def generate_dummy_data(output_path, num_samples=1000):
    columns = [
        "exam_id", "P_wave_duration_mean", "P_wave_duration_std", "P_wave_duration_min", "P_wave_duration_max",
        "PR_interval_mean", "PR_interval_std", "PR_interval_min", "PR_interval_max", "PR_segment_mean",
        "PR_segment_std", "PR_segment_min", "PR_segment_max", "QRS_duration_mean", "QRS_duration_std",
        "QRS_duration_min", "QRS_duration_max", "QT_interval_mean", "QT_interval_std", "QT_interval_min",
        "QT_interval_max", "ST_segment_mean", "ST_segment_std", "ST_segment_min", "ST_segment_max",
        "ST_slope_mean", "ST_slope_std", "ST_slope_min", "ST_slope_max", "HRV_MeanNN", "HRV_SDNN",
        "HRV_RMSSD", "HRV_SDSD", "HRV_CVNN", "HRV_CVSD", "HRV_MedianNN", "HRV_MadNN", "HRV_MCVNN",
        "HRV_IQRNN", "HRV_SDRMSSD", "HRV_Prc20NN", "HRV_Prc80NN", "HRV_pNN50", "HRV_pNN20", "HRV_MinNN",
        "HRV_MaxNN", "HRV_HTI", "HRV_TINN", "age", "is_male", "chagas"
    ]

    data = []
    for i in range(num_samples):
        # Generate some positive and negative examples
        is_chagas = np.random.choice([0, 1], p=[0.7, 0.3])
        
        row = [f"exam_{i}"]
        # Generate 47 continuous features
        for _ in range(47):
            val = np.random.normal(loc=1.0 if not is_chagas else 1.5, scale=0.2)
            row.append(val)
        
        # Add age and is_male
        row.append(np.random.randint(18, 80)) # age
        row.append(np.random.randint(0, 2))   # is_male
        
        # Add target
        row.append(is_chagas)
        
        data.append(row)

    df = pd.DataFrame(data, columns=columns)
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False)
    print(f"Generated dummy data at {output_path} with {num_samples} records.")

if __name__ == "__main__":
    generate_dummy_data("dataset/signals_features.csv", 1000)
