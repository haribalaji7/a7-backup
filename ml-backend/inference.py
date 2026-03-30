"""
Standalone inference script for crop disease detection (TensorFlow/Keras version).
Can be used independently after model training.

Usage:
    python inference.py <image_path> [model_dir]

Example:
    python inference.py test_leaf.jpg disease_model/
"""

import os
import sys
import json
import numpy as np
from pathlib import Path
from typing import Dict, Union
from PIL import Image


# ── Disease Knowledge Base ────────────────────────────────────────────────────

DISEASE_KNOWLEDGE = {
    "Apple___Apple_scab": {
        "severity_threshold": 65,
        "treatment": "Apply captan or myclobutanil fungicide at petal fall. Continue sprays at 7-10 day intervals during wet springs.",
        "prevention": "Plant scab-resistant varieties (Liberty, Enterprise). Rake and destroy fallen leaves in autumn.",
    },
    "Apple___Black_rot": {
        "severity_threshold": 70,
        "treatment": "Prune out cankers and mummified fruits. Apply captan or thiophanate-methyl fungicide.",
        "prevention": "Remove mummified fruits from tree and ground. Prune dead branches.",
    },
    "Apple___Cedar_apple_rust": {
        "severity_threshold": 70,
        "treatment": "Apply myclobutanil or mancozeb fungicide at pink bud stage. Repeat every 7-10 days.",
        "prevention": "Plant resistant apple varieties. Remove eastern red cedar within 1 mile if practical.",
    },
    "Apple___healthy": {
        "severity_threshold": 95,
        "treatment": "No treatment needed. Plant is healthy.",
        "prevention": "Continue proper orchard management.",
    },
    "Blueberry___healthy": {
        "severity_threshold": 95,
        "treatment": "No treatment needed. Plant is healthy.",
        "prevention": "Maintain acidic soil (pH 4.5-5.5). Mulch with pine bark.",
    },
    "Cherry_(including_sour)___Powdery_mildew": {
        "severity_threshold": 70,
        "treatment": "Apply sulfur or myclobutanil fungicide. Repeat every 10-14 days.",
        "prevention": "Ensure good air circulation. Avoid overhead irrigation.",
    },
    "Cherry_(including_sour)___healthy": {
        "severity_threshold": 95,
        "treatment": "No treatment needed. Plant is healthy.",
        "prevention": "Maintain proper irrigation and fertilization.",
    },
    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot": {
        "severity_threshold": 65,
        "treatment": "Apply propiconazole or azoxystrobin fungicide.",
        "prevention": "Rotate crops (2 years minimum). Use resistant hybrids.",
    },
    "Corn_(maize)___Common_rust_": {
        "severity_threshold": 70,
        "treatment": "Apply triazole fungicides (propiconazole) or mancozeb.",
        "prevention": "Plant resistant hybrids. Avoid early planting.",
    },
    "Corn_(maize)___Northern_Leaf_Blight": {
        "severity_threshold": 60,
        "treatment": "Apply foliar fungicides at tassel emergence.",
        "prevention": "Use resistant hybrids. Rotate crops.",
    },
    "Corn_(maize)___healthy": {
        "severity_threshold": 95,
        "treatment": "No treatment needed. Plant is healthy.",
        "prevention": "Continue integrated pest management.",
    },
    "Grape___Black_rot": {
        "severity_threshold": 65,
        "treatment": "Apply myclobutanil or mancozeb fungicide before bloom.",
        "prevention": "Remove mummies from vines and ground. Prune for air circulation.",
    },
    "Grape___Esca_(Black_Measles)": {
        "severity_threshold": 60,
        "treatment": "No curative treatment. Remove severely affected vines.",
        "prevention": "Avoid large pruning wounds. Protect cuts with wound sealant.",
    },
    "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)": {
        "severity_threshold": 65,
        "treatment": "Apply mancozeb or copper-based fungicides.",
        "prevention": "Maintain proper vine spacing. Prune for open canopy.",
    },
    "Grape___healthy": {
        "severity_threshold": 95,
        "treatment": "No treatment needed. Plant is healthy.",
        "prevention": "Maintain balanced nutrition and proper canopy management.",
    },
    "Orange___Haunglongbing_(Citrus_greening)": {
        "severity_threshold": 55,
        "treatment": "No cure exists. Remove and destroy infected trees. Control citrus psyllid vectors.",
        "prevention": "Use certified disease-free nursery stock. Implement area-wide psyllid control.",
    },
    "Peach___Bacterial_spot": {
        "severity_threshold": 70,
        "treatment": "Apply oxytetracycline or copper-based bactericides.",
        "prevention": "Plant resistant varieties. Choose well-drained sites.",
    },
    "Peach___healthy": {
        "severity_threshold": 95,
        "treatment": "No treatment needed. Plant is healthy.",
        "prevention": "Continue proper orchard management.",
    },
    "Pepper,_bell___Bacterial_spot": {
        "severity_threshold": 70,
        "treatment": "Spray copper-based bactericides. Remove infected plant parts.",
        "prevention": "Use certified disease-free seeds. Practice crop rotation.",
    },
    "Pepper,_bell___healthy": {
        "severity_threshold": 95,
        "treatment": "No treatment needed. Plant is healthy.",
        "prevention": "Maintain proper watering and fertilization.",
    },
    "Potato___Early_blight": {
        "severity_threshold": 65,
        "treatment": "Apply mancozeb or chlorothalonil at 7-10 day intervals.",
        "prevention": "Use certified seed potatoes. Rotate crops (3 years).",
    },
    "Potato___Late_blight": {
        "severity_threshold": 60,
        "treatment": "Apply metalaxyl + mancozeb immediately upon detection.",
        "prevention": "Use resistant varieties. Plant certified seed.",
    },
    "Potato___healthy": {
        "severity_threshold": 95,
        "treatment": "No treatment needed. Plant is healthy.",
        "prevention": "Maintain healthy growing conditions.",
    },
    "Raspberry___healthy": {
        "severity_threshold": 95,
        "treatment": "No treatment needed. Plant is healthy.",
        "prevention": "Prune old canes. Maintain good drainage.",
    },
    "Soybean___healthy": {
        "severity_threshold": 95,
        "treatment": "No treatment needed. Plant is healthy.",
        "prevention": "Rotate crops. Use disease-resistant varieties.",
    },
    "Squash___Powdery_mildew": {
        "severity_threshold": 70,
        "treatment": "Apply potassium bicarbonate, sulfur, or myclobutanil.",
        "prevention": "Plant resistant varieties. Ensure proper spacing.",
    },
    "Strawberry___Leaf_scorch": {
        "severity_threshold": 65,
        "treatment": "Apply copper-based fungicides at first sign of disease.",
        "prevention": "Use certified disease-free plants. Renovate beds after harvest.",
    },
    "Strawberry___healthy": {
        "severity_threshold": 95,
        "treatment": "No treatment needed. Plant is healthy.",
        "prevention": "Continue proper bed management and mulching.",
    },
    "Tomato___Bacterial_spot": {
        "severity_threshold": 70,
        "treatment": "Spray copper-based bactericides at 1-2 lb/acre.",
        "prevention": "Use certified disease-free seeds. Practice crop rotation.",
    },
    "Tomato___Early_blight": {
        "severity_threshold": 65,
        "treatment": "Apply chlorothalonil or mancozeb fungicide at 7-10 day intervals.",
        "prevention": "Rotate crops every 2-3 years. Remove plant debris.",
    },
    "Tomato___Late_blight": {
        "severity_threshold": 60,
        "treatment": "Apply mancozeb + metalaxyl immediately. Spray every 5-7 days in wet weather.",
        "prevention": "Use certified disease-free seeds. Ensure good air circulation.",
    },
    "Tomato___Leaf_Mold": {
        "severity_threshold": 70,
        "treatment": "Apply copper fungicides or chlorothalonil. Improve ventilation.",
        "prevention": "Use resistant varieties. Maintain humidity below 85%.",
    },
    "Tomato___Septoria_leaf_spot": {
        "severity_threshold": 65,
        "treatment": "Apply azoxystrobin or chlorothalonil at 7-day intervals.",
        "prevention": "Rotate crops. Mulch to prevent soil splash.",
    },
    "Tomato___Spider_mites Two-spotted_spider_mite": {
        "severity_threshold": 75,
        "treatment": "Apply neem oil spray or insecticidal soap.",
        "prevention": "Keep plants well watered. Encourage beneficial insects.",
    },
    "Tomato___Target_Spot": {
        "severity_threshold": 65,
        "treatment": "Apply mancozeb or copper fungicides.",
        "prevention": "Practice crop rotation. Avoid overhead irrigation.",
    },
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus": {
        "severity_threshold": 80,
        "treatment": "No cure. Remove infected plants. Control whitefly vectors.",
        "prevention": "Use TYLCV-resistant varieties. Install yellow sticky traps.",
    },
    "Tomato___Tomato_mosaic_virus": {
        "severity_threshold": 75,
        "treatment": "No chemical control. Remove infected plants. Disinfect tools.",
        "prevention": "Use certified virus-free seeds. Wash hands before handling plants.",
    },
    "Tomato___healthy": {
        "severity_threshold": 95,
        "treatment": "No treatment needed. Plant is healthy.",
        "prevention": "Continue proper watering, balanced fertilization, regular scouting.",
    },
    "unknown": {
        "severity_threshold": 70,
        "treatment": "Consult with local agricultural extension office for diagnosis.",
        "prevention": "Maintain good agricultural practices.",
    },
}


def get_severity(confidence: float, disease_name: str) -> str:
    """Calculate severity based on confidence and disease type."""
    disease_info = DISEASE_KNOWLEDGE.get(disease_name, DISEASE_KNOWLEDGE["unknown"])
    threshold = disease_info["severity_threshold"]

    if confidence >= threshold + 15:
        return "Severe"
    elif confidence >= threshold:
        return "Moderate"
    elif confidence >= threshold - 15:
        return "Mild"
    else:
        return "Critical"


def format_disease_name(raw_name: str) -> str:
    """Convert 'Tomato___Early_blight' to 'Tomato — Early Blight'."""
    if "___" in raw_name:
        parts = raw_name.split("___")
        crop = parts[0].replace("_", " ")
        disease = parts[1].replace("_", " ").title()
        return f"{crop} — {disease}"
    return raw_name.replace("_", " ").title()


def find_best_disease_key(predicted_class: str) -> str:
    """Match model class name to knowledge base key."""
    if predicted_class in DISEASE_KNOWLEDGE:
        return predicted_class
    norm = predicted_class.strip().lower().replace(" ", "_")
    for key in DISEASE_KNOWLEDGE:
        if key.lower().replace(" ", "_") == norm:
            return key
    for key in DISEASE_KNOWLEDGE:
        if predicted_class.replace(" ", "") in key.replace(" ", ""):
            return key
    return "unknown"


def predict_disease(
    image_path: Union[str, Path],
    model_dir: Union[str, Path] = "disease_model",
) -> Dict:
    """
    Load TensorFlow model and predict disease from image.

    Args:
        image_path: Path to the input image file
        model_dir: Directory containing trained_plant_disease_model.keras and class_names.json

    Returns:
        Dictionary with disease, confidence, severity, treatment, prevention
    """
    import tensorflow as tf

    model_dir = Path(model_dir)
    model_path = model_dir / "trained_plant_disease_model.keras"
    alt_path = model_dir / "trained_model.keras"
    class_names_path = model_dir / "class_names.json"

    if not model_path.exists() and alt_path.exists():
        model_path = alt_path

    if not model_path.exists():
        return {"success": False, "error": f"Model not found at {model_path}"}

    # Load model
    model = tf.keras.models.load_model(str(model_path))

    # Load class names
    if class_names_path.exists():
        with open(class_names_path, "r") as f:
            data = json.load(f)
        class_names = data.get("class_names", [])
    else:
        class_names = [
            "Apple___Apple_scab", "Apple___Black_rot", "Apple___Cedar_apple_rust",
            "Apple___healthy", "Blueberry___healthy",
            "Cherry_(including_sour)___Powdery_mildew", "Cherry_(including_sour)___healthy",
            "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot",
            "Corn_(maize)___Common_rust_", "Corn_(maize)___Northern_Leaf_Blight",
            "Corn_(maize)___healthy", "Grape___Black_rot",
            "Grape___Esca_(Black_Measles)", "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)",
            "Grape___healthy", "Orange___Haunglongbing_(Citrus_greening)",
            "Peach___Bacterial_spot", "Peach___healthy",
            "Pepper,_bell___Bacterial_spot", "Pepper,_bell___healthy",
            "Potato___Early_blight", "Potato___Late_blight", "Potato___healthy",
            "Raspberry___healthy", "Soybean___healthy", "Squash___Powdery_mildew",
            "Strawberry___Leaf_scorch", "Strawberry___healthy",
            "Tomato___Bacterial_spot", "Tomato___Early_blight", "Tomato___Late_blight",
            "Tomato___Leaf_Mold", "Tomato___Septoria_leaf_spot",
            "Tomato___Spider_mites Two-spotted_spider_mite", "Tomato___Target_Spot",
            "Tomato___Tomato_Yellow_Leaf_Curl_Virus", "Tomato___Tomato_mosaic_virus",
            "Tomato___healthy",
        ]

    # Get expected input size
    input_shape = model.input_shape
    img_size = input_shape[1] if input_shape[1] else 256

    # Load and preprocess image
    try:
        image = Image.open(image_path).convert("RGB")
    except Exception as e:
        return {"success": False, "error": f"Failed to load image: {str(e)}"}

    image = image.resize((img_size, img_size))
    img_array = np.array(image, dtype=np.float32) / 255.0
    img_array = np.expand_dims(img_array, axis=0)

    # Predict
    predictions = model.predict(img_array, verbose=0)
    predicted_idx = int(np.argmax(predictions[0]))
    confidence_value = float(predictions[0][predicted_idx]) * 100

    # Map to class name
    predicted_class = class_names[predicted_idx] if predicted_idx < len(class_names) else "unknown"

    # Look up knowledge
    disease_key = find_best_disease_key(predicted_class)
    disease_info = DISEASE_KNOWLEDGE.get(disease_key, DISEASE_KNOWLEDGE["unknown"])
    severity = get_severity(confidence_value, disease_key)

    # All probabilities
    all_probs = {}
    for i, p in enumerate(predictions[0]):
        cls = class_names[i] if i < len(class_names) else f"Class_{i}"
        all_probs[cls] = round(float(p) * 100, 2)

    return {
        "success": True,
        "disease": format_disease_name(predicted_class),
        "raw_class": predicted_class,
        "confidence": round(confidence_value, 2),
        "severity": severity,
        "treatment": disease_info["treatment"],
        "prevention": disease_info["prevention"],
        "all_probabilities": all_probs,
    }


# ── CLI Entry Point ──────────────────────────────────────────────────────────

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python inference.py <image_path> [model_dir]")
        print("Example: python inference.py test_leaf.jpg disease_model/")
        sys.exit(1)

    image_path = sys.argv[1]
    model_dir = sys.argv[2] if len(sys.argv) > 2 else "disease_model"

    result = predict_disease(image_path, model_dir)

    print("\n" + "=" * 50)
    print("CROP DISEASE DETECTION RESULT")
    print("=" * 50)

    if result.get("success"):
        print(f"Disease:    {result['disease']}")
        print(f"Confidence: {result['confidence']}%")
        print(f"Severity:   {result['severity']}")
        print(f"\nTreatment:\n  {result['treatment']}")
        print(f"\nPrevention:\n  {result['prevention']}")
    else:
        print(f"Error: {result.get('error', 'Unknown error')}")

    print("=" * 50)
