import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.applications import EfficientNetV2S
from tensorflow.keras.models import Sequential, Model
from tensorflow.keras.layers import (
    Dense, Dropout, GlobalAveragePooling2D, Input,
    RandomFlip, RandomRotation, RandomZoom, RandomBrightness,
    RandomContrast, GaussianNoise
)
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.optimizers.schedules import CosineDecayRestarts
from sklearn.utils.class_weight import compute_class_weight
import json
import glob

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


def apply_mixup(images, labels, alpha=0.3):
    """Apply MixUp augmentation to a batch."""
    g1 = tf.random.gamma([], alpha, 1.0)
    g2 = tf.random.gamma([], alpha, 1.0)
    lam = g1 / (g1 + g2)
    batch_size = tf.shape(images)[0]
    index = tf.random.shuffle(tf.range(batch_size))

    mixed_images = lam * images + (1 - lam) * tf.gather(images, index)
    mixed_labels = lam * labels + (1 - lam) * tf.gather(labels, index)
    return mixed_images, mixed_labels


def build_augmentation_model():
    return Sequential([
        RandomFlip("horizontal_and_vertical"),
        RandomRotation(0.3),
        RandomZoom(0.2),
        RandomBrightness(0.2),
        RandomContrast(0.2),
        GaussianNoise(0.1),
    ], name="augmentation")


def build_model(num_classes, input_shape=(256, 256, 3), lr=1e-3):
    base_model = EfficientNetV2S(
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

    steps_per_epoch = 1000
    lr_schedule = CosineDecayRestarts(
        initial_learning_rate=lr,
        first_decay_steps=steps_per_epoch,
        t_mul=2.0,
        m_mul=0.5,
        alpha=1e-4,
    )

    model.compile(
        optimizer=Adam(learning_rate=lr_schedule),
        loss=tf.keras.losses.CategoricalCrossentropy(label_smoothing=LABEL_SMOOTHING),
        metrics=['accuracy']
    )
    return model


def build_model_trainable(model, unfreeze_from=100, lr=1e-5):
    for layer in model.layers[-unfreeze_from:]:
        layer.trainable = True

    steps_per_epoch = 1000
    lr_schedule = CosineDecayRestarts(
        initial_learning_rate=lr,
        first_decay_steps=steps_per_epoch,
        t_mul=2.0,
        m_mul=0.5,
        alpha=1e-4,
    )

    model.compile(
        optimizer=Adam(learning_rate=lr_schedule),
        loss=tf.keras.losses.CategoricalCrossentropy(label_smoothing=LABEL_SMOOTHING),
        metrics=['accuracy']
    )
    return model


def load_and_preprocess_data():
    if not os.path.exists(DATASET_DIR):
        print(f"[ERROR] Dataset not found: {DATASET_DIR}")
        print("Download PlantVillage dataset and extract to that path.")
        return None, None, None, None

    all_image_paths = []
    all_labels = []
    class_names = sorted(os.listdir(DATASET_DIR))
    class_to_idx = {name: i for i, name in enumerate(class_names)}

    for class_name in class_names:
        class_dir = os.path.join(DATASET_DIR, class_name)
        if not os.path.isdir(class_dir):
            continue
        for img_path in glob.glob(os.path.join(class_dir, "*.jpg")):
            all_image_paths.append(img_path)
            all_labels.append(class_to_idx[class_name])

    all_labels = np.array(all_labels)
    class_weights = compute_class_weight(
        class_weight='balanced',
        classes=np.unique(all_labels),
        y=all_labels
    )
    class_weight_dict = dict(enumerate(class_weights))

    print(f"[INFO] Calculated class weights for {len(class_weight_dict)} classes")
    print(f"[INFO] Weight range: {class_weights.min():.3f} - {class_weights.max():.3f}")

    total_samples = len(all_image_paths)
    val_size = int(total_samples * 0.15)
    indices = np.random.permutation(total_samples)
    train_indices = indices[val_size:]
    val_indices = indices[:val_size]

    train_paths = [all_image_paths[i] for i in train_indices]
    train_labels = [all_labels[i] for i in train_indices]
    val_paths = [all_image_paths[i] for i in val_indices]
    val_labels = [all_labels[i] for i in val_indices]

    num_classes = len(class_names)

    def load_and_process(path, label):
        image = tf.io.read_file(path)
        image = tf.image.decode_jpeg(image, channels=3)
        image = tf.image.resize(image, IMG_SIZE)
        image = tf.cast(image, tf.float32) / 255.0
        label = tf.one_hot(label, num_classes)
        return image, label

    AUTOTUNE = tf.data.AUTOTUNE

    train_ds = tf.data.Dataset.from_tensor_slices((train_paths, train_labels))
    train_ds = train_ds.shuffle(len(train_paths), seed=42)
    train_ds = train_ds.map(load_and_process, num_parallel_calls=AUTOTUNE)
    train_ds = train_ds.batch(BATCH_SIZE)

    if MIXUP_ALPHA > 0:
        train_ds = train_ds.map(
            lambda x, y: apply_mixup(x, y, MIXUP_ALPHA),
            num_parallel_calls=AUTOTUNE
        )

    train_ds = train_ds.cache().prefetch(AUTOTUNE)

    val_ds = tf.data.Dataset.from_tensor_slices((val_paths, val_labels))
    val_ds = val_ds.map(load_and_process, num_parallel_calls=AUTOTUNE)
    val_ds = val_ds.batch(BATCH_SIZE)
    val_ds = val_ds.cache().prefetch(AUTOTUNE)

    return train_ds, val_ds, class_names, class_weight_dict


def main():
    print("=" * 60)
    print(" Agri Nova - Enhanced EfficientNetV2 Training")
    print(" Features: EfficientNetV2S, Class Weights, MixUp,")
    print("           Cosine Decay LR, Advanced Augmentation")
    print("=" * 60)

    data = load_and_preprocess_data()
    if data[0] is None:
        return

    train_ds, val_ds, class_names, class_weight_dict = data
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
    ]

    print("\n[PHASE 1] Training with frozen base model...")
    history1 = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=EPOCHS_PHASE1,
        callbacks=callbacks
    )
    print(f"[PHASE 1] Best val_accuracy: {max(history1.history['val_accuracy']):.4f}")

    print("\n[PHASE 2] Progressive fine-tuning (block by block)...")

    base_model = model.get_layer("efficientnetv2-s")
    total_layers = len(base_model.layers)
    blocks_to_unfreeze = [0.3, 0.6, 1.0]
    lr_values = [5e-5, 2e-5, 1e-5]

    for i, (fraction, lr) in enumerate(zip(blocks_to_unfreeze, lr_values)):
        unfreeze_count = int(total_layers * fraction)
        print(f"\n[PHASE 2.{i+1}] Unfreezing last {unfreeze_count} layers, LR={lr}")

        for layer in base_model.layers:
            layer.trainable = False
        for layer in base_model.layers[-unfreeze_count:]:
            layer.trainable = True

        steps_per_epoch = 1000
        lr_schedule = CosineDecayRestarts(
            initial_learning_rate=lr,
            first_decay_steps=steps_per_epoch,
            t_mul=2.0,
            m_mul=0.5,
            alpha=1e-4,
        )

        model.compile(
            optimizer=Adam(learning_rate=lr_schedule),
            loss=tf.keras.losses.CategoricalCrossentropy(label_smoothing=LABEL_SMOOTHING),
            metrics=['accuracy']
        )

        checkpoint_path2 = os.path.join(MODEL_DIR, f"best_phase2_block{i+1}.keras")
        callbacks2 = [
            ModelCheckpoint(checkpoint_path2, monitor='val_accuracy', save_best_only=True, verbose=1),
            EarlyStopping(monitor='val_accuracy', patience=4, restore_best_weights=True),
        ]

        sub_epochs = max(3, EPOCHS_PHASE2 // len(blocks_to_unfreeze))
        history2 = model.fit(
            train_ds,
            validation_data=val_ds,
            epochs=sub_epochs,
            callbacks=callbacks2
        )
        print(f"[PHASE 2.{i+1}] Best val_accuracy: {max(history2.history['val_accuracy']):.4f}")

    model.save(MODEL_SAVE_PATH)
    print(f"\n[SUCCESS] Model saved to: {MODEL_SAVE_PATH}")
    print("[INFO] Restart backend to use the new model.")


if __name__ == "__main__":
    main()
