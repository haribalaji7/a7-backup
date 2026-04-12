"""
Agri Nova - Fast Training (Optimized for CPU)
"""
import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.models import Sequential, Model
from tensorflow.keras.layers import (
    Dense, Dropout, GlobalAveragePooling2D, Input,
    RandomFlip, RandomRotation, RandomZoom
)
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.preprocessing.image import ImageDataGenerator
import json

DATASET_DIR = os.path.join(os.path.dirname(__file__), "PlantVillage-Dataset-master", "raw", "color")
MODEL_DIR = os.path.join(os.path.dirname(__file__), "disease_model")
MODEL_SAVE_PATH = os.path.join(MODEL_DIR, "trained_plant_disease_model.keras")
CLASS_NAMES_PATH = os.path.join(MODEL_DIR, "class_names.json")

IMG_SIZE = (128, 128)
BATCH_SIZE = 64
EPOCHS = 10


def main():
    print("=" * 60)
    print(" Fast Training - EfficientNetB0 (Optimized)")
    print("=" * 60)

    if not os.path.exists(DATASET_DIR):
        print(f"[ERROR] Dataset not found: {DATASET_DIR}")
        return

    datagen = ImageDataGenerator(
        rescale=1./255,
        rotation_range=20,
        width_shift_range=0.1,
        height_shift_range=0.1,
        horizontal_flip=True,
        zoom_range=0.15,
        validation_split=0.15,
    )

    train_ds = datagen.flow_from_directory(
        DATASET_DIR,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        subset='training',
        shuffle=True,
        seed=42
    )

    val_ds = datagen.flow_from_directory(
        DATASET_DIR,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        subset='validation',
        shuffle=False,
        seed=42
    )

    class_names = list(train_ds.class_indices.keys())
    num_classes = len(class_names)
    print(f"[INFO] {num_classes} classes, {train_ds.samples} train, {val_ds.samples} val")

    with open(CLASS_NAMES_PATH, "w") as f:
        json.dump({"class_names": class_names}, f)

    base_model = EfficientNetB0(include_top=False, weights='imagenet', input_shape=(128, 128, 3))
    base_model.trainable = False

    model = Sequential([
        Input(shape=(128, 128, 3)),
        RandomFlip("horizontal"),
        RandomRotation(0.15),
        RandomZoom(0.1),
        base_model,
        GlobalAveragePooling2D(),
        Dropout(0.5),
        Dense(256, activation='relu'),
        Dropout(0.3),
        Dense(num_classes, activation='softmax')
    ])

    model.compile(
        optimizer=Adam(1e-3),
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )

    print("\n[Training...]")
    model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=EPOCHS,
        callbacks=[
            EarlyStopping(monitor='val_accuracy', patience=3, restore_best_weights=True),
            ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=2)
        ]
    )

    model.save(MODEL_SAVE_PATH)
    print(f"\n[SUCCESS] Saved to: {MODEL_SAVE_PATH}")


if __name__ == "__main__":
    main()
