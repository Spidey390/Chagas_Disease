import os
import json
import numpy as np
import pandas as pd
import tensorflow as tf
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import subprocess

def build_model(input_dim):
    model = tf.keras.models.Sequential([
        # We process the features as 1 timestep, with `input_dim` features
        tf.keras.layers.LSTM(32, return_sequences=True, input_shape=(1, input_dim)),
        tf.keras.layers.Dropout(0.2),
        tf.keras.layers.LSTM(16, return_sequences=False),
        tf.keras.layers.Dense(1, activation='sigmoid')
    ])
    
    model.compile(
        optimizer='adam',
        loss='binary_crossentropy',
        metrics=['accuracy']
    )
    return model

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    dataset_path = os.path.join(script_dir, '..', 'dataset', 'signals_features.csv')
    if not os.path.exists(dataset_path):
        print(f"Dataset not found at {dataset_path}. Please place your dataset there.")
        return

    print("Loading dataset...")
    df = pd.read_csv(dataset_path)

    # Drop identifier columns not used for training
    if 'exam_id' in df.columns:
        df = df.drop(columns=['exam_id'])

    # Separate features and target
    X = df.drop(columns=['chagas'])
    y = df['chagas'].values

    feature_names = list(X.columns)
    print(f"Training on {len(feature_names)} features.")

    # Save feature names for backend reference
    os.makedirs('model_output', exist_ok=True)
    with open('model_output/feature_mapping.json', 'w') as f:
        json.dump(feature_names, f)

    # Splitting data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Scaling features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Save scaler mean and scale for TS inference
    scaler_params = {
        "mean": scaler.mean_.tolist(),
        "scale": scaler.scale_.tolist()
    }
    with open('model_output/scaler.json', 'w') as f:
        json.dump(scaler_params, f)

    # Reshape for LSTM: [batch_size, timesteps, features]
    # Here timesteps = 1
    X_train_reshaped = np.reshape(X_train_scaled, (X_train_scaled.shape[0], 1, X_train_scaled.shape[1]))
    X_test_reshaped = np.reshape(X_test_scaled, (X_test_scaled.shape[0], 1, X_test_scaled.shape[1]))

    print("Building model...")
    model = build_model(input_dim=X_train_scaled.shape[1])
    model.summary()

    print("Training model...")
    model.fit(
        X_train_reshaped, y_train,
        epochs=20,
        batch_size=32,
        validation_data=(X_test_reshaped, y_test)
    )

    loss, accuracy = model.evaluate(X_test_reshaped, y_test)
    print(f"Test Accuracy: {accuracy*100:.2f}%")

    # Save format
    os.makedirs('model_output/keras_model', exist_ok=True)
    h5_path = 'model_output/keras_model/model.h5'
    model.save(h5_path)
    print(f"Saved Keras model to {h5_path}")

    # Convert to tensorflowjs
    print("Converting model to TensorFlow.js format...")
    tfjs_output_dir = 'model_output/tfjs_model'
    try:
        subprocess.run([
            "tensorflowjs_converter", 
            "--input_format=keras", 
            h5_path, 
            tfjs_output_dir
        ], check=True)
        print(f"Successfully converted model to {tfjs_output_dir}")
    except Exception as e:
        print("Failed to run CLI tensorflowjs_converter. Trying python API...", e)
        import tensorflowjs as tfjs
        tfjs.converters.save_keras_model(model, tfjs_output_dir)
        print(f"Successfully converted model using Python API to {tfjs_output_dir}")

if __name__ == "__main__":
    main()
