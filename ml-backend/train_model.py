import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.multioutput import MultiOutputClassifier
import joblib
import os

df = pd.read_csv("CropDataset-Enhanced.csv")

print("Dataset shape:", df.shape)
print("Columns:", df.columns.tolist())
print("\nFirst few rows:")
print(df.head())

all_crops = set()
for crops in df["Crop"]:
    for crop in str(crops).split(","):
        all_crops.add(crop.strip())
all_crops = sorted(list(all_crops))
print(f"\nUnique crops ({len(all_crops)}):", all_crops)

multi_labels = np.zeros((len(df), len(all_crops)), dtype=int)
for idx, crops in enumerate(df["Crop"]):
    for crop in str(crops).split(","):
        crop = crop.strip()
        if crop in all_crops:
            multi_labels[idx, all_crops.index(crop)] = 1

feature_cols = ["N", "P", "K", "ph"]
X = df[feature_cols].values

region_encoder = LabelEncoder()
df["region_encoded"] = region_encoder.fit_transform(df["region"].str.strip())

X_region = df["region_encoded"].values.reshape(-1, 1)
X_full = np.hstack([X, X_region])

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X_full)

crop_to_idx = {crop: idx for idx, crop in enumerate(all_crops)}
idx_to_crop = {idx: crop for crop, idx in crop_to_idx.items()}

rf_model = RandomForestClassifier(
    n_estimators=200,
    max_depth=15,
    min_samples_split=3,
    min_samples_leaf=2,
    random_state=42,
    n_jobs=-1
)

rf_model.fit(X_scaled, multi_labels)

train_acc = rf_model.score(X_scaled, multi_labels)
print(f"\nTraining accuracy: {train_acc:.4f}")

model_data = {
    "model": rf_model,
    "scaler": scaler,
    "region_encoder": region_encoder,
    "feature_cols": feature_cols,
    "all_crops": all_crops,
    "crop_to_idx": crop_to_idx,
    "idx_to_crop": idx_to_crop,
}

joblib.dump(model_data, "crop_model.pkl")
print("\nModel saved to crop_model.pkl")

print("\nSample predictions:")
for i in range(3):
    probs = rf_model.predict_proba(X_scaled[i:i+1])
    prob_array = np.array([p[0, 1] if hasattr(p, 'shape') else p[0] for p in probs])
    top_indices = np.argsort(prob_array)[::-1][:3]
    top_crops = [(all_crops[idx], prob_array[idx]) for idx in top_indices]
    print(f"Sample {i+1}: N={X[i,0]}, P={X[i,1]}, K={X[i,2]}, pH={X[i,3]} -> Top crops: {top_crops}")
