"""
Agri Nova - EfficientNet Model Training (Local Data Only)
Trains on PlantVillage-Dataset-master/raw/color (38 classes).
Exports a .keras model that main.py auto-loads on startup.
"""

import os
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"           # suppress TF info logs
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"           # suppress oneDNN warning

import json
import tensorflow as tf

# ── Paths ────────────────────────────────────────────────────────────────────
DATASET_DIR = os.path.join(os.path.dirname(__file__),
                           "PlantVillage-Dataset-master", "raw", "color")
MODEL_DIR   = os.path.join(os.path.dirname(__file__), "disease_model")
os.makedirs(MODEL_DIR, exist_ok=True)

MODEL_SAVE_PATH  = os.path.join(MODEL_DIR, "trained_plant_disease_model.keras")
CLASS_NAMES_PATH = os.path.join(MODEL_DIR, "class_names.json")

# ── Hyper-parameters (tuned for local CPU/GPU) ───────────────────────────────
IMG_SIZE    = 224
BATCH_SIZE  = 16          # smaller batch = less RAM
EPOCHS      = 15
LR          = 1e-3
FINE_TUNE_LR = 1e-5       # for phase-2 unfreezing


def main():
    print("=" * 60)
    print(" Agri Nova – EfficientNetB0 Training (Local Dataset)")
    print("=" * 60)

    if not os.path.isdir(DATASET_DIR):
        print(f"[ERROR] Dataset not found at:\n  {DATASET_DIR}")
        return

    # ── 1. Load dataset ──────────────────────────────────────────────────
    print(f"\n[1/5] Loading images from {DATASET_DIR} ...")

    train_ds = tf.keras.utils.image_dataset_from_directory(
        DATASET_DIR,
        validation_split=0.2,
        subset="training",
        seed=42,
        image_size=(IMG_SIZE, IMG_SIZE),
        batch_size=BATCH_SIZE,
        label_mode="int",
    )

    val_ds = tf.keras.utils.image_dataset_from_directory(
        DATASET_DIR,
        validation_split=0.2,
        subset="validation",
        seed=42,
        image_size=(IMG_SIZE, IMG_SIZE),
        batch_size=BATCH_SIZE,
        label_mode="int",
    )

    class_names = train_ds.class_names
    num_classes = len(class_names)
    print(f"   Found {num_classes} classes")

    # Save class names for the inference API
    with open(CLASS_NAMES_PATH, "w") as f:
        json.dump({"class_names": class_names}, f, indent=2)
    print(f"   Saved class_names.json ({num_classes} entries)")

    # ── 2. Optimise pipeline ─────────────────────────────────────────────
    AUTOTUNE = tf.data.AUTOTUNE
    train_ds = train_ds.cache().shuffle(1000).prefetch(AUTOTUNE)
    val_ds   = val_ds.cache().prefetch(AUTOTUNE)

    # ── 3. Build model ───────────────────────────────────────────────────
    print("\n[2/5] Building EfficientNetB0 model ...")

    # Data-augmentation block (runs only during training)
    data_aug = tf.keras.Sequential([
        tf.keras.layers.RandomFlip("horizontal_and_vertical"),
        tf.keras.layers.RandomRotation(0.2),
        tf.keras.layers.RandomZoom(0.15),
        tf.keras.layers.RandomContrast(0.2),
    ], name="augmentation")

    # Pre-trained backbone
    base = tf.keras.applications.EfficientNetB0(
        include_top=False,
        weights="imagenet",
        input_shape=(IMG_SIZE, IMG_SIZE, 3),
    )
    base.trainable = False        # freeze for phase-1

    inputs  = tf.keras.Input(shape=(IMG_SIZE, IMG_SIZE, 3))
    x = data_aug(inputs)
    x = tf.keras.applications.efficientnet.preprocess_input(x)
    x = base(x, training=False)
    x = tf.keras.layers.GlobalAveragePooling2D()(x)
    x = tf.keras.layers.Dropout(0.4)(x)
    x = tf.keras.layers.Dense(256, activation="relu")(x)
    x = tf.keras.layers.Dropout(0.3)(x)
    outputs = tf.keras.layers.Dense(num_classes, activation="softmax")(x)

    model = tf.keras.Model(inputs, outputs)

    model.compile(
        optimizer=tf.keras.optimizers.Adam(LR),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )

    total_params     = model.count_params()
    trainable_params = sum(
        tf.keras.backend.count_params(w) for w in model.trainable_weights
    )
    print(f"   Total params:     {total_params:,}")
    print(f"   Trainable params: {trainable_params:,}")

    # ── 4. Phase-1: Train classifier head (base frozen) ──────────────────
    print(f"\n[3/5] Phase 1 – training classifier head ({EPOCHS} epochs) ...")

    callbacks = [
        tf.keras.callbacks.EarlyStopping(
            monitor="val_accuracy", patience=4, restore_best_weights=True,
        ),
        tf.keras.callbacks.ModelCheckpoint(
            MODEL_SAVE_PATH, monitor="val_accuracy",
            save_best_only=True, verbose=1,
        ),
    ]

    model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=EPOCHS,
        callbacks=callbacks,
    )

    # ── 5. Phase-2: Fine-tune top layers of backbone ─────────────────────
    print("\n[4/5] Phase 2 – fine-tuning top 20 backbone layers ...")

    base.trainable = True
    # Freeze all layers except the last 20
    for layer in base.layers[:-20]:
        layer.trainable = False

    model.compile(
        optimizer=tf.keras.optimizers.Adam(FINE_TUNE_LR),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )

    model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=10,
        callbacks=callbacks,
    )

    # ── 6. Done ──────────────────────────────────────────────────────────
    print(f"\n[5/5] ✅ Training complete!")
    print(f"   Model saved to: {MODEL_SAVE_PATH}")
    print(f"   Class names at: {CLASS_NAMES_PATH}")
    print(f"\n   Restart the server with  npm run dev  to use the new model.")


if __name__ == "__main__":
    main()
