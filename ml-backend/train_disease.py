"""
Train PlantVillage disease detection model
Downloads dataset from GitHub and trains CNN model
"""
import os
import sys
import zipfile
import urllib.request
import random
from pathlib import Path
from collections import defaultdict

import numpy as np
from PIL import Image
import json

print("=" * 60)
print("PlantVillage Dataset Training")
print("=" * 60)

# Paths
SCRIPT_DIR = Path(__file__).parent
MODEL_DIR = SCRIPT_DIR / "disease_model"
DATASET_DIR = SCRIPT_DIR / "dataset"

# Disease classes (PlantVillage format)
DISEASE_CLASSES = [
    "Apple___Apple_scab", "Apple___Black_rot", "Apple___Cedar_apple_rust", "Apple___healthy",
    "Blueberry___healthy", "Cherry_(including_sour)___Powdery_mildew", "Cherry_(including_sour)___healthy",
    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot", "Corn_(maize)___Common_rust_",
    "Corn_(maize)___Northern_Leaf_Blight", "Corn_(maize)___healthy",
    "Grape___Black_rot", "Grape___Esca_(Black_Measles)", "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)",
    "Grape___healthy", "Orange___Haunglongbing_(Citrus_greening)",
    "Peach___Bacterial_spot", "Peach___healthy",
    "Pepper,_bell___Bacterial_spot", "Pepper,_bell___healthy",
    "Potato___Early_blight", "Potato___Late_blight", "Potato___healthy",
    "Raspberry___healthy", "Soybean___healthy",
    "Squash___Powdery_mildew",
    "Strawberry___Leaf_scorch", "Strawberry___healthy",
    "Tomato___Bacterial_spot", "Tomato___Early_blight", "Tomato___Late_blight",
    "Tomato___Leaf_Mold", "Tomato___Septoria_leaf_spot", "Tomato___Spider_mites Two-spotted_spider_mite",
    "Tomato___Target_Spot", "Tomato___Tomato_Yellow_Leaf_Curl_Virus", "Tomato___Tomato_mosaic_virus",
    "Tomato___healthy"
]

# Download dataset from GitHub mirror
def download_dataset():
    print("\n[1/5] Downloading PlantVillage dataset...")
    
    if DATASET_DIR.exists():
        print("  Dataset already exists.")
        return True
    
    zip_path = SCRIPT_DIR / "plantvillage_raw.zip"
    urls_to_try = [
        "https://github.com/spMohanty/PlantVillage-Dataset/archive/refs/heads/master.zip",
        "https://github.com/harvesthq/PlantVillage-Dataset/archive/refs/heads/master.zip"
    ]
    
    for url in urls_to_try:
        try:
            print(f"  Trying: {url[:60]}...")
            urllib.request.urlretrieve(url, zip_path)
            print("  Download complete!")
            break
        except Exception as e:
            print(f"  Failed: {e}")
            continue
    else:
        print("  Could not download from GitHub.")
        print("  Creating synthetic training data instead...")
        return False
    
    print("\n[2/5] Extracting dataset...")
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(SCRIPT_DIR)
    os.remove(zip_path)
    
    # Find extracted directory
    for item in SCRIPT_DIR.iterdir():
        if item.is_dir() and 'PlantVillage' in item.name:
            extracted_dir = item
            break
    else:
        extracted_dir = None
    
    if extracted_dir:
        # Move contents to dataset directory
        real_path = extracted_dir / "PlantVillage Dataset" / "raw"
        if real_path.exists():
            for item in real_path.iterdir():
                item.rename(DATASET_DIR / item.name)
        else:
            # Try other paths
            for p in extracted_dir.rglob("**/color"):
                if p.is_dir():
                    color_dir = p.parent
                    for item in color_dir.iterdir():
                        if item.is_dir():
                            (DATASET_DIR / item.name).mkdir(exist_ok=True)
                            for img in item.glob("*"):
                                if img.suffix.lower() in ['.jpg', '.jpeg', '.png']:
                                    pass  # Will be collected later
                    break
    
    return True

# Collect all image paths
def collect_images():
    print("\n[3/5] Collecting images...")
    image_paths = defaultdict(list)
    
    # Common dataset locations
    search_paths = [
        DATASET_DIR,
        SCRIPT_DIR / "PlantVillage-Dataset-master" / "PlantVillage Dataset" / "raw" / "color",
        SCRIPT_DIR / "PlantVillage-Dataset-master",
    ]
    
    for search_path in search_paths:
        if not search_path.exists():
            continue
        
        for class_dir in search_path.iterdir():
            if class_dir.is_dir() and class_dir.name in DISEASE_CLASSES:
                for img_path in class_dir.glob("*"):
                    if img_path.suffix.lower() in ['.jpg', '.jpeg', '.png']:
                        image_paths[class_dir.name].append(img_path)
    
    # Check GitHub structure
    if not image_paths:
        for search_path in search_paths:
            if not search_path.exists():
                continue
            for class_dir in search_path.iterdir():
                if class_dir.is_dir():
                    class_name = class_dir.name.replace("_", " ").replace("-", " ")
                    # Try to match class names
                    for disease_class in DISEASE_CLASSES:
                        if disease_class.replace("_", " ").lower() in class_name.lower() or \
                           class_name.lower() in disease_class.replace("_", " ").lower():
                            for img_path in class_dir.glob("*"):
                                if img_path.suffix.lower() in ['.jpg', '.jpeg', '.png']:
                                    image_paths[disease_class].append(img_path)
    
    total = sum(len(v) for v in image_paths.values())
    print(f"  Found {total} images across {len(image_paths)} classes")
    
    if total < 100:
        print("  Not enough images found. Generating synthetic data...")
        return generate_synthetic_data()
    
    return dict(image_paths)

# Generate synthetic data for demo
def generate_synthetic_data():
    print("  Generating synthetic training images...")
    DATASET_DIR.mkdir(exist_ok=True)
    
    image_paths = defaultdict(list)
    img_size = 224
    samples_per_class = 100
    
    for disease_class in DISEASE_CLASSES:
        class_dir = DATASET_DIR / disease_class
        class_dir.mkdir(exist_ok=True)
        
        # Set seed based on class for reproducibility
        random.seed(hash(disease_class) % 2**32)
        
        for i in range(samples_per_class):
            # Create synthetic leaf image with disease patterns
            if "healthy" in disease_class:
                # Healthy green leaf
                base_color = (
                    random.randint(50, 120),   # R
                    random.randint(120, 200),  # G  
                    random.randint(50, 120)   # B
                )
            elif "blight" in disease_class.lower() or "spot" in disease_class.lower():
                # Brown/yellow spots
                base_color = (
                    random.randint(80, 150),
                    random.randint(100, 150),
                    random.randint(40, 100)
                )
            elif "rust" in disease_class.lower():
                # Orange/brown rust
                base_color = (
                    random.randint(150, 200),
                    random.randint(80, 130),
                    random.randint(30, 80)
                )
            elif "mildew" in disease_class.lower() or "powdery" in disease_class.lower():
                # White/gray powdery mildew
                base_color = (
                    random.randint(150, 220),
                    random.randint(150, 220),
                    random.randint(140, 200)
                )
            else:
                # Default disease pattern
                base_color = (
                    random.randint(80, 180),
                    random.randint(80, 160),
                    random.randint(50, 120)
                )
            
            img = Image.new('RGB', (img_size, img_size), base_color)
            
            # Add some variation/patterns
            from PIL import ImageDraw, ImageFilter
            draw = ImageDraw.Draw(img)
            
            # Add spots for disease
            for _ in range(random.randint(5, 20)):
                x, y = random.randint(0, img_size), random.randint(0, img_size)
                r = random.randint(5, 25)
                spot_color = (
                    random.randint(100, 200),
                    random.randint(50, 150),
                    random.randint(20, 80)
                )
                draw.ellipse([x-r, y-r, x+r, y+r], fill=spot_color)
            
            img_path = class_dir / f"sample_{i}.jpg"
            img.save(img_path, quality=85)
            image_paths[disease_class].append(img_path)
    
    total = sum(len(v) for v in image_paths.values())
    print(f"  Generated {total} synthetic images")
    return dict(image_paths)

# Build and train model using TensorFlow/Keras
def train_model(image_paths):
    print("\n[4/5] Training CNN model...")
    
    import tensorflow as tf
    from tensorflow.keras import layers, models
    from tensorflow.keras.preprocessing.image import ImageDataGenerator
    
    IMG_SIZE = 224
    BATCH_SIZE = 32
    EPOCHS = 10  # Reduced for demo, increase for better accuracy
    
    # Create temporary directory structure for ImageDataGenerator
    train_dir = DATASET_DIR / "train_temp"
    train_dir.mkdir(exist_ok=True)
    
    # Copy/link images to temp structure
    print("  Preparing image directories...")
    
    # Use ImageDataGenerator to load directly from current structure
    datagen = ImageDataGenerator(
        rescale=1./255,
        validation_split=0.2,
        rotation_range=30,
        width_shift_range=0.2,
        height_shift_range=0.2,
        horizontal_flip=True,
        zoom_range=0.2,
        fill_mode='nearest'
    )
    
    # For training, we'll use a custom approach since directory structure varies
    print("  Loading training data...")
    
    # Collect all images and labels
    all_images = []
    all_labels = []
    
    for class_name, paths in image_paths.items():
        for path in paths:
            all_images.append(path)
            all_labels.append(class_name)
    
    # Convert to numpy arrays
    images_array = np.zeros((len(all_images), IMG_SIZE, IMG_SIZE, 3), dtype=np.float32)
    labels_array = []
    
    for idx, (img_path, label) in enumerate(zip(all_images, all_labels)):
        try:
            img = Image.open(img_path).convert('RGB')
            img = img.resize((IMG_SIZE, IMG_SIZE))
            images_array[idx] = np.array(img) / 255.0
            labels_array.append(DISEASE_CLASSES.index(label) if label in DISEASE_CLASSES else 0)
        except Exception as e:
            print(f"  Error loading {img_path}: {e}")
    
    labels_array = np.array(labels_array)
    
    # One-hot encode labels
    num_classes = len(DISEASE_CLASSES)
    labels_onehot = tf.keras.utils.to_categorical(labels_array, num_classes)
    
    # Split data
    from sklearn.model_selection import train_test_split
    X_train, X_val, y_train, y_val = train_test_split(
        images_array, labels_onehot, test_size=0.2, random_state=42, stratify=labels_array
    )
    
    print(f"  Training samples: {len(X_train)}")
    print(f"  Validation samples: {len(X_val)}")
    
    # Build CNN model
    print("  Building CNN model...")
    model = models.Sequential([
        layers.Conv2D(32, (3, 3), activation='relu', input_shape=(IMG_SIZE, IMG_SIZE, 3)),
        layers.MaxPooling2D((2, 2)),
        layers.Conv2D(64, (3, 3), activation='relu'),
        layers.MaxPooling2D((2, 2)),
        layers.Conv2D(128, (3, 3), activation='relu'),
        layers.MaxPooling2D((2, 2)),
        layers.Conv2D(128, (3, 3), activation='relu'),
        layers.MaxPooling2D((2, 2)),
        layers.Flatten(),
        layers.Dropout(0.5),
        layers.Dense(512, activation='relu'),
        layers.Dropout(0.3),
        layers.Dense(num_classes, activation='softmax')
    ])
    
    model.compile(
        optimizer='adam',
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    
    model.summary()
    
    # Train
    print("  Training model...")
    history = model.fit(
        X_train, y_train,
        epochs=EPOCHS,
        batch_size=BATCH_SIZE,
        validation_data=(X_val, y_val),
        verbose=1
    )
    
    # Save model
    print("\n[5/5] Saving model...")
    MODEL_DIR.mkdir(exist_ok=True)
    model_path = MODEL_DIR / "trained_plant_disease_model.keras"
    model.save(model_path)
    print(f"  Model saved to: {model_path}")
    
    # Save class names
    class_names_path = MODEL_DIR / "class_names.json"
    with open(class_names_path, 'w') as f:
        json.dump(DISEASE_CLASSES, f)
    print(f"  Class names saved to: {class_names_path}")
    
    # Print results
    final_loss, final_acc = model.evaluate(X_val, y_val, verbose=0)
    print(f"\n  Final validation accuracy: {final_acc*100:.2f}%")
    print("\n" + "=" * 60)
    print("TRAINING COMPLETE!")
    print("=" * 60)
    
    return model, history

# Main
if __name__ == "__main__":
    os.chdir(SCRIPT_DIR)
    
    # Download or find dataset
    download_dataset()
    
    # Collect images
    image_paths = collect_images()
    
    # Train model
    model, history = train_model(image_paths)
    
    print("\nRestart the backend server to load the new model.")
