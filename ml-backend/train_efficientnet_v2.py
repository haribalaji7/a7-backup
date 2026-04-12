import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.applications import EfficientNetB3
from tensorflow.keras.models import Sequential, Model
from tensorflow.keras.layers import (
    Dense, Dropout, GlobalAveragePooling2D, Input,
    RandomFlip, RandomRotation, RandomZoom, RandomBrightness,
    RandomContrast, Layer
)
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping, ReduceLROnPlateau
from tensorflow.keras.optimizers import Adam
import json

DATASET_DIR = os.path.join(os.path.dirname(__file__), "PlantVillage-Dataset-master", "raw", "color")
MODEL_DIR = os.path.join(os.path.dirname(__file__), "disease_model")
os.makedirs(MODEL_DIR, exist_ok=True)
MODEL_SAVE_PATH = os.path.join(MODEL_DIR, "trained_plant_disease_model.keras")
CLASS_NAMES_PATH = os.path.join(MODEL_DIR, "class_names.json")

IMG_SIZE = (256, 256)
BATCH_SIZE = 32
EPOCHS_PHASE1 = 5
EPOCHS_PHASE2 = 10
LABEL_SMOOTHING = 0.1
MIXUP_ALPHA = 0.3


def mixup_data(x, y, alpha=0.3):
    """Apply MixUp augmentation."""
    if alpha > 0:
        lam = np.random.beta(alpha, alpha)
    else:
        lam = 1

    batch_size = x.shape[0]
    index = np.random.permutation(batch_size)

    mixed_x = lam * x + (1 - lam) * x[index]
    y_a, y_b = y, y[index]
    return mixed_x, y_a, y_b, lam


def mixup_loss(loss_fn):
    """MixUp-aware loss function."""
    def mixup_loss_fn(y_true, y_pred, lam):
        return lam * loss_fn(y_true, y_pred) + (1 - lam) * loss_fn(y_true, y_pred)
    return mixup_loss_fn


class MixUpCallback(tf.keras.callbacks.Callback):
    def __init__(self, alpha=0.3):
        super().__init__()
        self.alpha = alpha

    def on_epoch_end(self, epoch, logs=None):
        logs = logs or {}


def build_augmentation_model():
    return Sequential([
        RandomFlip("horizontal_and_vertical"),
        RandomRotation(0.25),
        RandomZoom(0.15),
        RandomBrightness(0.2),
        RandomContrast(0.15),
    ], name="augmentation")


def build_model(num_classes, input_shape=(256, 256, 3)):
    base_model = EfficientNetB3(
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


def build_model_trainable(model, unfreeze_from=100):
    for layer in model.layers[-unfreeze_from:]:
        layer.trainable = True
    
    model.compile(
        optimizer=Adam(learning_rate=1e-5),
        loss=tf.keras.losses.CategoricalCrossentropy(label_smoothing=LABEL_SMOOTHING),
        metrics=['accuracy']
    )
    return model


def load_and_preprocess_data():
    if not os.path.exists(DATASET_DIR):
        print(f"[ERROR] Dataset not found: {DATASET_DIR}")
        print("Download PlantVillage dataset and extract to that path.")
        return None, None, None

    train_ds = tf.keras.preprocessing.image_dataset_from_directory(
        DATASET_DIR,
        validation_split=0.15,
        subset="training",
        seed=42,
        image_size=IMG_SIZE,
        batch_size=BATCH_SIZE
    )

    val_ds = tf.keras.preprocessing.image_dataset_from_directory(
        DATASET_DIR,
        validation_split=0.15,
        subset="validation",
        seed=42,
        image_size=IMG_SIZE,
        batch_size=BATCH_SIZE
    )

    class_names = train_ds.class_names
    num_classes = len(class_names)
    print(f"[INFO] Found {num_classes} classes, {len(train_ds)} train samples")

    AUTOTUNE = tf.data.AUTOTUNE
    
    def process_images(images, labels):
        images = tf.cast(images, tf.float32) / 255.0
        labels = tf.one_hot(labels, num_classes)
        return images, labels

    train_ds = train_ds.map(process_images).cache().prefetch(AUTOTUNE)
    val_ds = val_ds.map(process_images).cache().prefetch(AUTOTUNE)

    return train_ds, val_ds, class_names


def train_with_mixup(model, train_ds, val_ds, epochs, use_mixup=True, callbacks=None):
    """Training function with optional MixUp."""
    if not use_mixup:
        return model.fit(train_ds, validation_data=val_ds, epochs=epochs, callbacks=callbacks)
    
    class MixUpModelWrapper:
        def __init__(self, model, alpha=0.3):
            self.model = model
            self.alpha = alpha
            self.loss_fn = tf.keras.losses.CategoricalCrossentropy(label_smoothing=0.1)
        
        def train_step(self, data):
            x, y = data
            x_mixed, y_a, y_b, lam = mixup_data(x.numpy(), y.numpy(), self.alpha)
            x_mixed = tf.constant(x_mixed)
            y_a = tf.constant(y_a)
            y_b = tf.constant(y_b)
            
            with tf.GradientTape() as tape:
                y_pred = self.model(x_mixed, training=True)
                loss = lam * self.loss_fn(y_a, y_pred) + (1 - lam) * self.loss_fn(y_b, y_pred)
            
            grads = tape.gradient(loss, self.model.trainable_variables)
            self.model.optimizer.apply_gradients(zip(grads, self.model.trainable_variables))
            return {"loss": loss, "accuracy": self._accuracy(y_a, y_pred) * lam + self._accuracy(y_b, y_pred) * (1 - lam)}
        
        def _accuracy(self, y_true, y_pred):
            pred = tf.argmax(y_pred, axis=1)
            true = tf.argmax(y_true, axis=1)
            return tf.reduce_mean(tf.cast(tf.equal(pred, true), tf.float32))
    
    print("[INFO] Using standard training (MixUp can be enabled in Phase 2)")
    return model.fit(train_ds, validation_data=val_ds, epochs=epochs, callbacks=callbacks)


def main():
    print("=" * 60)
    print(" Agri Nova - Enhanced EfficientNet Training")
    print(" Features: Advanced Augmentation, Label Smoothing, Fine-tuning")
    print("=" * 60)

    data = load_and_preprocess_data()
    if data[0] is None:
        return
    
    train_ds, val_ds, class_names = data
    num_classes = len(class_names)

    with open(CLASS_NAMES_PATH, "w") as f:
        json.dump({"class_names": class_names}, f)
    print(f"[INFO] Saved class names to {CLASS_NAMES_PATH}")

    model = build_model(num_classes)
    model.summary()

    checkpoint_path = os.path.join(MODEL_DIR, "best_phase1.keras")
    callbacks = [
        ModelCheckpoint(checkpoint_path, monitor='val_accuracy', save_best_only=True, verbose=1),
        EarlyStopping(monitor='val_accuracy', patience=3, restore_best_weights=True),
        ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=2, min_lr=1e-6),
    ]

    print("\n[PHASE 1] Training with frozen base model...")
    history1 = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=EPOCHS_PHASE1,
        callbacks=callbacks
    )
    print(f"[PHASE 1] Best val_accuracy: {max(history1.history['val_accuracy']):.4f}")

    print("\n[PHASE 2] Fine-tuning with unfrozen layers...")
    model = build_model_trainable(model, unfreeze_from=100)
    
    checkpoint_path2 = os.path.join(MODEL_DIR, "best_phase2.keras")
    callbacks2 = [
        ModelCheckpoint(checkpoint_path2, monitor='val_accuracy', save_best_only=True, verbose=1),
        EarlyStopping(monitor='val_accuracy', patience=5, restore_best_weights=True),
        ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=2, min_lr=1e-7),
    ]

    history2 = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=EPOCHS_PHASE2,
        callbacks=callbacks2
    )
    print(f"[PHASE 2] Best val_accuracy: {max(history2.history['val_accuracy']):.4f}")

    model.save(MODEL_SAVE_PATH)
    print(f"\n[SUCCESS] Model saved to: {MODEL_SAVE_PATH}")
    print("[INFO] Restart backend to use the new model.")


if __name__ == "__main__":
    main()
