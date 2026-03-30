"""
Train PlantVillage disease model with real images (memory efficient)
"""
import os
from pathlib import Path
import shutil

import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, Dense, Dropout, BatchNormalization, Input
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint
from tensorflow.keras.preprocessing.image import ImageDataGenerator

print("=" * 60)
print("PlantVillage Dataset Training (Memory Efficient)")
print("=" * 60)

# Paths
DATA_DIR = Path("PlantVillage-Dataset-master/raw/color")
MODEL_DIR = Path("disease_model")
MODEL_DIR.mkdir(exist_ok=True)

IMG_SIZE = 128
BATCH_SIZE = 64

# Get all class folders
class_folders = sorted([f for f in DATA_DIR.iterdir() if f.is_dir()])
num_classes = len(class_folders)
print(f"\n[INFO] Found {num_classes} disease classes")

# Save class names
class_names = [f.name for f in class_folders]
with open(MODEL_DIR / "class_names.json", "w") as f:
    import json
    json.dump(class_names, f)
print(f"[OK] Saved class names to class_names.json")

# Count images
total_images = sum(1 for cf in class_folders for _ in cf.glob("*.JPG"))
total_images += sum(1 for cf in class_folders for _ in cf.glob("*.jpg"))
total_images += sum(1 for cf in class_folders for _ in cf.glob("*.png"))
print(f"[INFO] Found {total_images} images")

# Data generators (loads images on-the-fly, no memory issues)
print("\n[1/3] Setting up data generators...")

train_datagen = ImageDataGenerator(
    rescale=1./255,
    rotation_range=20,
    width_shift_range=0.2,
    height_shift_range=0.2,
    horizontal_flip=True,
    zoom_range=0.2,
    validation_split=0.2
)

train_generator = train_datagen.flow_from_directory(
    DATA_DIR,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode='sparse',
    subset='training',
    shuffle=True
)

val_generator = train_datagen.flow_from_directory(
    DATA_DIR,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode='sparse',
    subset='validation',
    shuffle=False
)

print(f"  Training samples: {train_generator.samples}")
print(f"  Validation samples: {val_generator.samples}")

# Build model
print("\n[2/3] Building model...")
model = Sequential([
    Input(shape=(IMG_SIZE, IMG_SIZE, 3)),
    Conv2D(32, (3, 3), activation='relu'),
    BatchNormalization(),
    MaxPooling2D(2, 2),
    Conv2D(64, (3, 3), activation='relu'),
    BatchNormalization(),
    MaxPooling2D(2, 2),
    Conv2D(128, (3, 3), activation='relu'),
    BatchNormalization(),
    MaxPooling2D(2, 2),
    Conv2D(256, (3, 3), activation='relu'),
    BatchNormalization(),
    MaxPooling2D(2, 2),
    Flatten(),
    Dense(512, activation='relu'),
    Dropout(0.5),
    Dense(256, activation='relu'),
    Dropout(0.3),
    Dense(num_classes, activation='softmax')
])

model.compile(
    optimizer=Adam(learning_rate=0.001),
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)

model.summary()

# Callbacks
callbacks = [
    EarlyStopping(monitor='val_accuracy', patience=5, restore_best_weights=True),
    ModelCheckpoint(str(MODEL_DIR / 'trained_plant_disease_model.keras'), monitor='val_accuracy', save_best_only=True)
]

# Train
print("\n[3/3] Training model...")
history = model.fit(
    train_generator,
    epochs=25,
    validation_data=val_generator,
    callbacks=callbacks,
    verbose=1
)

# Save final model
model.save(MODEL_DIR / 'trained_plant_disease_model.keras')
print(f"\n[OK] Model saved to {MODEL_DIR / 'trained_plant_disease_model.keras'}")

# Results
print(f"\n[RESULTS]")
print(f"  Final training accuracy: {history.history['accuracy'][-1]*100:.1f}%")
print(f"  Final validation accuracy: {history.history['val_accuracy'][-1]*100:.1f}%")
print("\nTraining complete!")
