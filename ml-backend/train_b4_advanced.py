"""
Agri Nova - Enhanced Model Training with EfficientNetB4
Improved training with advanced augmentation for real-world images
"""
import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.applications import EfficientNetB4
from tensorflow.keras.models import Sequential, Model
from tensorflow.keras.layers import (
    Dense, Dropout, GlobalAveragePooling2D, Input,
    RandomFlip, RandomRotation, RandomZoom, RandomBrightness,
    RandomContrast, Rescaling, Conv2D, GaussianNoise
)
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping, ReduceLROnPlateau
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.preprocessing.image import ImageDataGenerator
import json

DATASET_DIR = os.path.join(os.path.dirname(__file__), "PlantVillage-Dataset-master", "raw", "color")
MODEL_DIR = os.path.join(os.path.dirname(__file__), "disease_model")
os.makedirs(MODEL_DIR, exist_ok=True)
MODEL_SAVE_PATH = os.path.join(MODEL_DIR, "trained_plant_disease_model.keras")
CLASS_NAMES_PATH = os.path.join(MODEL_DIR, "class_names.json")

IMG_SIZE = (256, 256)
BATCH_SIZE = 32
EPOCHS_PHASE1 = 8
EPOCHS_PHASE2 = 12
LABEL_SMOOTHING = 0.1


def build_augmentation_model():
    """Advanced augmentation for real-world images."""
    return Sequential([
        RandomFlip("horizontal_and_vertical"),
        RandomRotation(0.3),
        RandomZoom(0.2),
        RandomBrightness(0.25),
        RandomContrast(0.2),
        GaussianNoise(0.1),
    ], name="augmentation")


def build_model(num_classes, input_shape=(256, 256, 3)):
    """Build EfficientNetB4 model."""
    base_model = EfficientNetB4(
        include_top=False,
        weights='imagenet',
        input_shape=input_shape
    )
    base_model.trainable = False

    inputs = Input(shape=input_shape)
    x = build_augmentation_model()(inputs)
    x = base_model(x, training=False)
    x = GlobalAveragePooling2D()(x)
    x = Dropout(0.5)(x)
    x = Dense(512, activation='relu')(x)
    x = Dropout(0.4)(x)
    outputs = Dense(num_classes, activation='softmax')(x)

    model = Model(inputs=inputs, outputs=outputs)
    
    model.compile(
        optimizer=Adam(learning_rate=1e-3),
        loss=tf.keras.losses.CategoricalCrossentropy(label_smoothing=LABEL_SMOOTHING),
        metrics=['accuracy']
    )
    return model


def build_model_trainable(model, unfreeze_from=150):
    """Unfreeze layers for fine-tuning."""
    for layer in model.layers[-unfreeze_from:]:
        layer.trainable = True
    
    model.compile(
        optimizer=Adam(learning_rate=1e-5),
        loss=tf.keras.losses.CategoricalCrossentropy(label_smoothing=LABEL_SMOOTHING),
        metrics=['accuracy']
    )
    return model


def load_data():
    """Load and preprocess dataset."""
    if not os.path.exists(DATASET_DIR):
        print(f"[ERROR] Dataset not found: {DATASET_DIR}")
        return None, None, None

    train_datagen = ImageDataGenerator(
        rescale=1./255,
        validation_split=0.15,
    )

    train_ds = train_datagen.flow_from_directory(
        DATASET_DIR,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        subset='training',
        shuffle=True,
        seed=42
    )

    val_ds = train_datagen.flow_from_directory(
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
    
    print(f"[INFO] Found {num_classes} classes")
    print(f"[INFO] Training samples: {train_ds.samples}")
    print(f"[INFO] Validation samples: {val_ds.samples}")

    return train_ds, val_ds, class_names


def main():
    print("=" * 60)
    print(" Agri Nova - EfficientNetB4 Training")
    print(" Advanced Augmentation for Real-World Images")
    print("=" * 60)

    train_ds, val_ds, class_names = load_data()
    if train_ds is None:
        print("Please ensure PlantVillage dataset is available.")
        return
    
    num_classes = len(class_names)

    with open(CLASS_NAMES_PATH, "w") as f:
        json.dump({"class_names": class_names}, f)
    print(f"[INFO] Saved class names to {CLASS_NAMES_PATH}")

    print("\n[PHASE 1] Building model...")
    model = build_model(num_classes)
    model.summary()

    callbacks1 = [
        ModelCheckpoint(
            os.path.join(MODEL_DIR, "best_phase1.keras"),
            monitor='val_accuracy', save_best_only=True, verbose=1
        ),
        EarlyStopping(monitor='val_accuracy', patience=3, restore_best_weights=True),
        ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=2, min_lr=1e-6),
    ]

    print("\n[PHASE 1] Training with frozen base model...")
    history1 = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=EPOCHS_PHASE1,
        callbacks=callbacks1
    )
    best_val_acc_1 = max(history1.history['val_accuracy'])
    print(f"[PHASE 1] Best val_accuracy: {best_val_acc_1:.4f}")

    print("\n[PHASE 2] Fine-tuning with unfrozen layers...")
    model = build_model_trainable(model, unfreeze_from=150)
    
    callbacks2 = [
        ModelCheckpoint(
            os.path.join(MODEL_DIR, "best_phase2.keras"),
            monitor='val_accuracy', save_best_only=True, verbose=1
        ),
        EarlyStopping(monitor='val_accuracy', patience=5, restore_best_weights=True),
        ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=2, min_lr=1e-7),
    ]

    history2 = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=EPOCHS_PHASE2,
        callbacks=callbacks2
    )
    best_val_acc_2 = max(history2.history['val_accuracy'])
    print(f"[PHASE 2] Best val_accuracy: {best_val_acc_2:.4f}")

    model.save(MODEL_SAVE_PATH)
    print(f"\n[SUCCESS] Model saved to: {MODEL_SAVE_PATH}")
    print(f"[INFO] Combined best accuracy: {max(best_val_acc_1, best_val_acc_2):.4f}")
    print("\n[INFO] Restart backend to use the new model.")


if __name__ == "__main__":
    main()
