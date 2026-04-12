"""
=============================================================================
Agri Nova — Crop Disease Detection Model Training (Google Colab Edition)
=============================================================================

HOW TO USE (Google Colab):
1. Go to https://colab.research.google.com
2. Create a new notebook
3. Runtime → Change runtime type → GPU (T4)
4. Copy-paste this ENTIRE file into a single code cell and run it
5. When prompted, upload your kaggle.json API key
6. After training completes, the model file will auto-download

Based on: https://github.com/Kshitij-Dasare/AI-Based-Crops-Pest-and-disease-Detection-Model
Dataset:  https://www.kaggle.com/datasets/vipoooool/new-plant-diseases-dataset
"""

# ── Step 0: Install & Import ─────────────────────────────────────────────────
import subprocess, sys

def install(pkg):
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", pkg])

try:
    import tensorflow as tf
except ImportError:
    install("tensorflow")
    import tensorflow as tf

print(f"TensorFlow version: {tf.__version__}")
print(f"GPU available: {tf.config.list_physical_devices('GPU')}")

import os
import json
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path

# ── Step 1: Download PlantVillage Dataset from Kaggle ─────────────────────────

def download_dataset():
    """Download the New Plant Diseases Dataset from Kaggle."""
    try:
        import kaggle
    except ImportError:
        install("kaggle")
        import kaggle

    # For Colab: upload kaggle.json
    kaggle_json = Path.home() / ".kaggle" / "kaggle.json"
    if not kaggle_json.exists():
        print("=" * 60)
        print("KAGGLE API KEY REQUIRED")
        print("=" * 60)
        print("Option 1 (Colab): Upload kaggle.json when prompted")
        print("Option 2: Place kaggle.json in ~/.kaggle/")
        print()

        try:
            from google.colab import files
            print("Upload your kaggle.json file:")
            uploaded = files.upload()
            kaggle_json.parent.mkdir(parents=True, exist_ok=True)
            with open(kaggle_json, "wb") as f:
                f.write(uploaded["kaggle.json"])
            os.chmod(kaggle_json, 0o600)
            print("✓ Kaggle API key saved!")
        except ImportError:
            print("Not running in Colab. Place kaggle.json manually.")
            return None

    dataset_dir = Path("dataset")
    if not dataset_dir.exists():
        print("\nDownloading PlantVillage dataset (~2.5 GB)...")
        os.system("kaggle datasets download -d vipoooool/new-plant-diseases-dataset -p dataset --unzip")
        print("✓ Dataset downloaded!")
    else:
        print("✓ Dataset already exists, skipping download.")

    # Find the actual data directories
    base = dataset_dir / "New Plant Diseases Dataset(Augmented)" / "New Plant Diseases Dataset(Augmented)"
    if not base.exists():
        base = dataset_dir / "New Plant Diseases Dataset(Augmented)"
    if not base.exists():
        # Try finding train directory
        for p in dataset_dir.rglob("train"):
            base = p.parent
            break

    train_dir = None
    valid_dir = None
    for p in base.iterdir():
        name_lower = p.name.lower()
        if "train" in name_lower and p.is_dir():
            train_dir = p
        elif "valid" in name_lower and p.is_dir():
            valid_dir = p

    if train_dir is None:
        # Fallback: search recursively
        for p in dataset_dir.rglob("*"):
            if p.is_dir() and "train" in p.name.lower():
                train_dir = p
            if p.is_dir() and "valid" in p.name.lower():
                valid_dir = p

    print(f"Train dir: {train_dir}")
    print(f"Valid dir: {valid_dir}")
    return train_dir, valid_dir


# ── Step 2: Data Loading & Preprocessing ──────────────────────────────────────

IMG_SIZE = 256
BATCH_SIZE = 32
EPOCHS = 15
LEARNING_RATE = 0.0001

def load_data(train_dir, valid_dir):
    """Load and preprocess the dataset."""
    print("\n" + "=" * 60)
    print("LOADING DATASET")
    print("=" * 60)

    train_data = tf.keras.utils.image_dataset_from_directory(
        str(train_dir),
        batch_size=BATCH_SIZE,
        image_size=(IMG_SIZE, IMG_SIZE),
        seed=123,
        shuffle=True,
    )

    val_data = tf.keras.utils.image_dataset_from_directory(
        str(valid_dir),
        batch_size=BATCH_SIZE,
        image_size=(IMG_SIZE, IMG_SIZE),
        seed=123,
        shuffle=False,
    )

    class_names = train_data.class_names
    num_classes = len(class_names)

    print(f"\n✓ Found {num_classes} classes:")
    for i, name in enumerate(class_names):
        print(f"   {i:2d}. {name}")

    # Normalize pixel values to [0, 1]
    normalization_layer = tf.keras.layers.Rescaling(1.0 / 255)
    train_data = train_data.map(lambda x, y: (normalization_layer(x), y))
    val_data = val_data.map(lambda x, y: (normalization_layer(x), y))

    # Performance optimization
    AUTOTUNE = tf.data.AUTOTUNE
    train_data = train_data.cache().prefetch(buffer_size=AUTOTUNE)
    val_data = val_data.cache().prefetch(buffer_size=AUTOTUNE)

    return train_data, val_data, class_names, num_classes


# ── Step 3: Visualize Sample Images ──────────────────────────────────────────

def visualize_samples(dataset, class_names):
    """Show sample images from the dataset."""
    plt.figure(figsize=(15, 15))
    for images, labels in dataset.take(1):
        for i in range(min(16, len(images))):
            ax = plt.subplot(4, 4, i + 1)
            plt.imshow(images[i].numpy())
            plt.title(class_names[labels[i]], fontsize=9)
            plt.axis("off")
    plt.suptitle("Sample Training Images", fontsize=16)
    plt.tight_layout()
    plt.savefig("sample_images.png", dpi=100)
    plt.show()
    print("✓ Sample images saved to sample_images.png")


# ── Step 4: Build the CNN Model ──────────────────────────────────────────────

def build_model(num_classes):
    """
    Build CNN model matching the GitHub repo architecture.
    Uses a custom CNN with data augmentation layers.
    """
    print("\n" + "=" * 60)
    print("BUILDING MODEL")
    print("=" * 60)

    inputs = tf.keras.layers.Input(shape=(IMG_SIZE, IMG_SIZE, 3))

    # Data augmentation (only active during training)
    x = tf.keras.layers.RandomFlip("horizontal")(inputs)
    x = tf.keras.layers.RandomRotation(0.2)(x)
    x = tf.keras.layers.RandomZoom(0.1)(x)

    # Conv Block 1: 32 filters
    x = tf.keras.layers.Conv2D(32, 3, padding="same", activation="relu")(x)
    x = tf.keras.layers.BatchNormalization()(x)
    x = tf.keras.layers.Conv2D(32, 3, activation="relu")(x)
    x = tf.keras.layers.BatchNormalization()(x)
    x = tf.keras.layers.MaxPooling2D(pool_size=2, strides=2)(x)

    # Conv Block 2: 64 filters
    x = tf.keras.layers.Conv2D(64, 3, padding="same", activation="relu")(x)
    x = tf.keras.layers.BatchNormalization()(x)
    x = tf.keras.layers.Conv2D(64, 3, activation="relu")(x)
    x = tf.keras.layers.BatchNormalization()(x)
    x = tf.keras.layers.MaxPooling2D(pool_size=2, strides=2)(x)

    # Conv Block 3: 128 filters
    x = tf.keras.layers.Conv2D(128, 3, padding="same", activation="relu")(x)
    x = tf.keras.layers.BatchNormalization()(x)
    x = tf.keras.layers.Conv2D(128, 3, activation="relu")(x)
    x = tf.keras.layers.BatchNormalization()(x)
    x = tf.keras.layers.MaxPooling2D(pool_size=2, strides=2)(x)

    # Conv Block 4: 256 filters
    x = tf.keras.layers.Conv2D(256, 3, padding="same", activation="relu")(x)
    x = tf.keras.layers.BatchNormalization()(x)
    x = tf.keras.layers.Conv2D(256, 3, activation="relu")(x)
    x = tf.keras.layers.BatchNormalization()(x)
    x = tf.keras.layers.MaxPooling2D(pool_size=2, strides=2)(x)

    # Conv Block 5: 512 filters
    x = tf.keras.layers.Conv2D(512, 3, padding="same", activation="relu")(x)
    x = tf.keras.layers.BatchNormalization()(x)
    x = tf.keras.layers.Conv2D(512, 3, activation="relu")(x)
    x = tf.keras.layers.BatchNormalization()(x)
    x = tf.keras.layers.MaxPooling2D(pool_size=2, strides=2)(x)

    # Dense layers
    x = tf.keras.layers.Dropout(0.25)(x)
    x = tf.keras.layers.Flatten()(x)
    x = tf.keras.layers.Dense(256, activation="relu")(x)
    x = tf.keras.layers.Dropout(0.4)(x)
    x = tf.keras.layers.Dense(128, activation="relu")(x)
    x = tf.keras.layers.Dropout(0.2)(x)
    x = tf.keras.layers.Dense(64, activation="relu")(x)
    x = tf.keras.layers.Dropout(0.1)(x)

    # Output layer
    outputs = tf.keras.layers.Dense(num_classes, activation="softmax")(x)

    model = tf.keras.Model(inputs=inputs, outputs=outputs, name="crop_disease_cnn")

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=LEARNING_RATE),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )

    model.summary()
    return model


# ── Step 5: Train the Model ──────────────────────────────────────────────────

def train_model(model, train_data, val_data):
    """Train with early stopping and learning rate scheduling."""
    print("\n" + "=" * 60)
    print("TRAINING MODEL")
    print("=" * 60)

    callbacks = [
        tf.keras.callbacks.EarlyStopping(
            monitor="val_accuracy",
            patience=5,
            restore_best_weights=True,
            verbose=1,
        ),
        tf.keras.callbacks.ReduceLROnPlateau(
            monitor="val_loss",
            factor=0.5,
            patience=3,
            min_lr=1e-7,
            verbose=1,
        ),
        tf.keras.callbacks.ModelCheckpoint(
            "best_model.keras",
            monitor="val_accuracy",
            save_best_only=True,
            verbose=1,
        ),
    ]

    history = model.fit(
        train_data,
        validation_data=val_data,
        epochs=EPOCHS,
        callbacks=callbacks,
    )

    return history


# ── Step 6: Plot Training Results ─────────────────────────────────────────────

def plot_results(history):
    """Plot accuracy and loss curves."""
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

    # Accuracy
    ax1.plot(history.history["accuracy"], label="Train Accuracy", linewidth=2)
    ax1.plot(history.history["val_accuracy"], label="Val Accuracy", linewidth=2)
    ax1.set_title("Model Accuracy", fontsize=14, fontweight="bold")
    ax1.set_xlabel("Epoch")
    ax1.set_ylabel("Accuracy")
    ax1.legend()
    ax1.grid(True, alpha=0.3)

    # Loss
    ax2.plot(history.history["loss"], label="Train Loss", linewidth=2)
    ax2.plot(history.history["val_loss"], label="Val Loss", linewidth=2)
    ax2.set_title("Model Loss", fontsize=14, fontweight="bold")
    ax2.set_xlabel("Epoch")
    ax2.set_ylabel("Loss")
    ax2.legend()
    ax2.grid(True, alpha=0.3)

    plt.tight_layout()
    plt.savefig("training_results.png", dpi=150)
    plt.show()
    print("✓ Training results saved to training_results.png")


# ── Step 7: Evaluate Model ───────────────────────────────────────────────────

def evaluate_model(model, val_data, class_names):
    """Full evaluation with confusion matrix."""
    print("\n" + "=" * 60)
    print("EVALUATING MODEL")
    print("=" * 60)

    # Overall metrics
    loss, accuracy = model.evaluate(val_data)
    print(f"\n✓ Validation Loss:     {loss:.4f}")
    print(f"✓ Validation Accuracy: {accuracy * 100:.2f}%")

    # Per-class predictions
    all_preds = []
    all_labels = []
    for images, labels in val_data:
        preds = model.predict(images, verbose=0)
        all_preds.extend(np.argmax(preds, axis=1))
        all_labels.extend(labels.numpy())

    all_preds = np.array(all_preds)
    all_labels = np.array(all_labels)

    # Classification report (top-level)
    from sklearn.metrics import classification_report, confusion_matrix

    print("\n── Per-Class Performance ──")
    report = classification_report(
        all_labels, all_preds, target_names=class_names, output_dict=True
    )
    for cls in class_names:
        if cls in report:
            stats = report[cls]
            print(f"   {cls:45s}  Prec: {stats['precision']:.2f}  Rec: {stats['recall']:.2f}  F1: {stats['f1-score']:.2f}")

    return accuracy


# ── Step 8: Export Model & Class Names ────────────────────────────────────────

def export_model(model, class_names):
    """Save model and class mapping for deployment."""
    print("\n" + "=" * 60)
    print("EXPORTING MODEL")
    print("=" * 60)

    # Save the Keras model
    model_path = "trained_plant_disease_model.keras"
    model.save(model_path)
    size_mb = os.path.getsize(model_path) / (1024 * 1024)
    print(f"✓ Model saved: {model_path} ({size_mb:.1f} MB)")

    # Save class names mapping
    class_mapping = {
        "class_names": class_names,
        "idx_to_class": {i: name for i, name in enumerate(class_names)},
        "class_to_idx": {name: i for i, name in enumerate(class_names)},
        "num_classes": len(class_names),
        "image_size": IMG_SIZE,
        "model_file": model_path,
    }

    with open("class_names.json", "w") as f:
        json.dump(class_mapping, f, indent=2)
    print("✓ Class mapping saved: class_names.json")

    # Try to auto-download in Colab
    try:
        from google.colab import files
        print("\n📥 Downloading files to your computer...")
        files.download(model_path)
        files.download("class_names.json")
        if os.path.exists("training_results.png"):
            files.download("training_results.png")
    except ImportError:
        print(f"\nFiles saved locally:")
        print(f"  1. {model_path}")
        print(f"  2. class_names.json")
        print(f"\nCopy these to your project: ml-backend/disease_model/")

    return model_path


# ── Step 9: Quick Test Prediction ─────────────────────────────────────────────

def test_prediction(model, val_data, class_names):
    """Run a quick prediction test."""
    print("\n" + "=" * 60)
    print("TEST PREDICTION")
    print("=" * 60)

    for images, labels in val_data.take(1):
        # Pick first 5 images
        for i in range(min(5, len(images))):
            img = images[i:i+1]
            pred = model.predict(img, verbose=0)
            pred_idx = np.argmax(pred[0])
            confidence = pred[0][pred_idx] * 100
            actual = class_names[labels[i].numpy()]
            predicted = class_names[pred_idx]
            status = "✓" if actual == predicted else "✗"
            print(f"   {status} Actual: {actual:40s} → Predicted: {predicted:40s} ({confidence:.1f}%)")


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN: Run Everything
# ═══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    print("=" * 60)
    print("  🌾 SMART AGRI AI — CROP DISEASE MODEL TRAINING")
    print("=" * 60)

    # 1. Download dataset
    result = download_dataset()
    if result is None:
        print("Failed to download dataset. Please check your Kaggle API key.")
        sys.exit(1)
    train_dir, valid_dir = result

    # 2. Load data
    train_data, val_data, class_names, num_classes = load_data(train_dir, valid_dir)

    # 3. Visualize
    visualize_samples(train_data, class_names)

    # 4. Build model
    model = build_model(num_classes)

    # 5. Train
    history = train_model(model, train_data, val_data)

    # 6. Plot
    plot_results(history)

    # 7. Evaluate
    accuracy = evaluate_model(model, val_data, class_names)

    # 8. Test
    test_prediction(model, val_data, class_names)

    # 9. Export
    model_path = export_model(model, class_names)

    print("\n" + "=" * 60)
    print(f"  🎉 TRAINING COMPLETE!")
    print(f"  Accuracy: {accuracy * 100:.2f}%")
    print(f"  Model: {model_path}")
    print("=" * 60)
    print()
    print("NEXT STEPS:")
    print("  1. Download trained_plant_disease_model.keras")
    print("  2. Download class_names.json")
    print("  3. Place both in your project: ml-backend/disease_model/")
    print("  4. Start backend: cd ml-backend && uvicorn main:app --port 8000")
    print("  5. Start frontend: npm run next:dev")
    print()
