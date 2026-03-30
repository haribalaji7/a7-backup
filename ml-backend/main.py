from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import numpy as np
import os
import io
import json

app = FastAPI(title="Smart Agri AI - Crop Disease Detection API", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1):(3000|3001|8080).*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_DIR = os.path.join(os.path.dirname(__file__), "disease_model")

# =============================================================================
# FULL 38-CLASS DISEASE KNOWLEDGE BASE (PlantVillage Dataset)
# =============================================================================

DISEASE_KNOWLEDGE = {
    # ── Apple ──────────────────────────────────────────────────────────
    "Apple___Apple_scab": {
        "severity_threshold": 65,
        "treatment": "Apply captan or myclobutanil fungicide at petal fall. Continue sprays at 7-10 day intervals during wet springs. Remove fallen infected leaves.",
        "prevention": "Plant scab-resistant varieties (Liberty, Enterprise). Rake and destroy fallen leaves in autumn. Ensure good air circulation in the canopy.",
        "crop": "Apple",
        "category": "fungal",
    },
    "Apple___Black_rot": {
        "severity_threshold": 70,
        "treatment": "Prune out cankers and mummified fruits. Apply captan or thiophanate-methyl fungicide. Remove dead wood during dormant season.",
        "prevention": "Remove mummified fruits from tree and ground. Prune dead branches. Maintain tree vigor with proper nutrition and watering.",
        "crop": "Apple",
        "category": "fungal",
    },
    "Apple___Cedar_apple_rust": {
        "severity_threshold": 70,
        "treatment": "Apply myclobutanil or mancozeb fungicide at pink bud stage. Repeat every 7-10 days through petal fall. Remove nearby cedar/juniper trees if possible.",
        "prevention": "Plant resistant apple varieties. Remove eastern red cedar within 1 mile if practical. Apply preventive fungicide sprays in spring.",
        "crop": "Apple",
        "category": "fungal",
    },
    "Apple___healthy": {
        "severity_threshold": 95,
        "treatment": "No treatment needed. Plant is healthy.",
        "prevention": "Continue proper orchard management: balanced fertilization, adequate irrigation, regular pruning, and pest monitoring.",
        "crop": "Apple",
        "category": "healthy",
    },

    # ── Blueberry ─────────────────────────────────────────────────────
    "Blueberry___healthy": {
        "severity_threshold": 95,
        "treatment": "No treatment needed. Plant is healthy.",
        "prevention": "Maintain acidic soil (pH 4.5-5.5). Mulch with pine bark. Provide consistent moisture and proper pruning.",
        "crop": "Blueberry",
        "category": "healthy",
    },

    # ── Cherry ────────────────────────────────────────────────────────
    "Cherry_(including_sour)___Powdery_mildew": {
        "severity_threshold": 70,
        "treatment": "Apply sulfur or myclobutanil fungicide at first sign of infection. Repeat every 10-14 days. Remove severely infected shoots.",
        "prevention": "Ensure good air circulation. Avoid overhead irrigation. Plant in full sun. Prune to open canopy structure.",
        "crop": "Cherry",
        "category": "fungal",
    },
    "Cherry_(including_sour)___healthy": {
        "severity_threshold": 95,
        "treatment": "No treatment needed. Plant is healthy.",
        "prevention": "Maintain proper irrigation and fertilization. Monitor for pests and diseases regularly. Prune for good airflow.",
        "crop": "Cherry",
        "category": "healthy",
    },

    # ── Corn / Maize ──────────────────────────────────────────────────
    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot": {
        "severity_threshold": 65,
        "treatment": "Apply propiconazole or azoxystrobin fungicide. Remove lower infected leaves. Ensure adequate nitrogen fertilization.",
        "prevention": "Rotate crops (2 years minimum). Use resistant hybrids. Manage crop residue through tillage. Maintain balanced nutrition.",
        "crop": "Corn",
        "category": "fungal",
    },
    "Corn_(maize)___Common_rust_": {
        "severity_threshold": 70,
        "treatment": "Apply triazole fungicides (propiconazole) or mancozeb. Early application is most effective. Scout fields regularly.",
        "prevention": "Plant resistant hybrids. Avoid early planting. Monitor weather conditions. Consider tolerant varieties for late plantings.",
        "crop": "Corn",
        "category": "fungal",
    },
    "Corn_(maize)___Northern_Leaf_Blight": {
        "severity_threshold": 60,
        "treatment": "Apply foliar fungicides (azoxystrobin + propiconazole) at tassel emergence. Two applications may be needed in severe years.",
        "prevention": "Use resistant hybrids. Rotate crops. Tillage to bury infected residue. Scout fields after silking.",
        "crop": "Corn",
        "category": "fungal",
    },
    "Corn_(maize)___healthy": {
        "severity_threshold": 95,
        "treatment": "No treatment needed. Plant is healthy.",
        "prevention": "Continue integrated pest management practices and balanced fertilization program.",
        "crop": "Corn",
        "category": "healthy",
    },

    # ── Grape ─────────────────────────────────────────────────────────
    "Grape___Black_rot": {
        "severity_threshold": 65,
        "treatment": "Apply myclobutanil or mancozeb fungicide before bloom. Continue through veraison. Remove mummified berries and infected leaves.",
        "prevention": "Remove mummies from vines and ground. Prune for good air circulation. Apply dormant sprays. Scout regularly after rain.",
        "crop": "Grape",
        "category": "fungal",
    },
    "Grape___Esca_(Black_Measles)": {
        "severity_threshold": 60,
        "treatment": "No curative treatment available. Remove severely affected vines. Apply wound protectants after pruning. Trunk injection with fungicides may help.",
        "prevention": "Avoid large pruning wounds. Protect cuts with wound sealant. Ensure proper drainage. Use certified disease-free planting material.",
        "crop": "Grape",
        "category": "fungal",
    },
    "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)": {
        "severity_threshold": 65,
        "treatment": "Apply mancozeb or copper-based fungicides. Remove infected leaves. Improve canopy ventilation through pruning.",
        "prevention": "Maintain proper vine spacing. Prune for open canopy. Avoid excessive nitrogen. Remove leaf litter in fall.",
        "crop": "Grape",
        "category": "fungal",
    },
    "Grape___healthy": {
        "severity_threshold": 95,
        "treatment": "No treatment needed. Plant is healthy.",
        "prevention": "Maintain balanced nutrition, proper canopy management, and regular scouting for pests and diseases.",
        "crop": "Grape",
        "category": "healthy",
    },

    # ── Orange ────────────────────────────────────────────────────────
    "Orange___Haunglongbing_(Citrus_greening)": {
        "severity_threshold": 55,
        "treatment": "No cure exists. Remove and destroy infected trees to prevent spread. Control Asian citrus psyllid vectors with imidacloprid or spinosad. Nutritional sprays may prolong tree life.",
        "prevention": "Use certified disease-free nursery stock. Implement area-wide psyllid control programs. Scout for psyllids regularly. Report suspected infections.",
        "crop": "Orange",
        "category": "bacterial",
    },

    # ── Peach ─────────────────────────────────────────────────────────
    "Peach___Bacterial_spot": {
        "severity_threshold": 70,
        "treatment": "Apply oxytetracycline or copper-based bactericides. Spray before and after petal fall. Avoid overhead irrigation.",
        "prevention": "Plant resistant varieties. Choose well-drained planting sites. Avoid wetting foliage. Maintain proper tree nutrition.",
        "crop": "Peach",
        "category": "bacterial",
    },
    "Peach___healthy": {
        "severity_threshold": 95,
        "treatment": "No treatment needed. Plant is healthy.",
        "prevention": "Continue proper orchard management with balanced nutrition and regular pest monitoring.",
        "crop": "Peach",
        "category": "healthy",
    },

    # ── Pepper ────────────────────────────────────────────────────────
    "Pepper,_bell___Bacterial_spot": {
        "severity_threshold": 70,
        "treatment": "Spray copper-based bactericides (Copper hydroxide 77% WDG) at 1-2 lb/acre. Remove and destroy infected plant parts. Avoid overhead irrigation.",
        "prevention": "Use certified disease-free seeds and transplants. Practice crop rotation (2-3 years). Avoid working in wet fields.",
        "crop": "Pepper",
        "category": "bacterial",
    },
    "Pepper,_bell___healthy": {
        "severity_threshold": 95,
        "treatment": "No treatment needed. Plant is healthy.",
        "prevention": "Maintain proper watering, balanced fertilization, and regular pest monitoring. Use mulch to prevent soil splash.",
        "crop": "Pepper",
        "category": "healthy",
    },

    # ── Potato ────────────────────────────────────────────────────────
    "Potato___Early_blight": {
        "severity_threshold": 65,
        "treatment": "Apply mancozeb or chlorothalonil at 7-10 day intervals. Remove infected lower leaves. Maintain proper irrigation.",
        "prevention": "Use certified seed potatoes. Rotate crops (3 years). Avoid stress conditions. Remove plant debris after harvest.",
        "crop": "Potato",
        "category": "fungal",
    },
    "Potato___Late_blight": {
        "severity_threshold": 60,
        "treatment": "Apply metalaxyl + mancozeb or fluopicolide immediately upon detection. Repeat every 5-7 days in favorable conditions.",
        "prevention": "Use resistant varieties. Plant certified seed. Destroy cull piles. Avoid overhead irrigation. Monitor weather for blight warnings.",
        "crop": "Potato",
        "category": "oomycete",
    },
    "Potato___healthy": {
        "severity_threshold": 95,
        "treatment": "No treatment needed. Plant is healthy.",
        "prevention": "Maintain current healthy growing conditions with balanced nutrition and proper watering.",
        "crop": "Potato",
        "category": "healthy",
    },

    # ── Raspberry ─────────────────────────────────────────────────────
    "Raspberry___healthy": {
        "severity_threshold": 95,
        "treatment": "No treatment needed. Plant is healthy.",
        "prevention": "Prune old canes after fruiting. Maintain good drainage. Apply mulch and balanced fertilizer annually.",
        "crop": "Raspberry",
        "category": "healthy",
    },

    # ── Soybean ───────────────────────────────────────────────────────
    "Soybean___healthy": {
        "severity_threshold": 95,
        "treatment": "No treatment needed. Plant is healthy.",
        "prevention": "Rotate crops. Use disease-resistant varieties. Monitor for pests regularly. Maintain proper soil fertility.",
        "crop": "Soybean",
        "category": "healthy",
    },

    # ── Squash ────────────────────────────────────────────────────────
    "Squash___Powdery_mildew": {
        "severity_threshold": 70,
        "treatment": "Apply potassium bicarbonate, sulfur, or myclobutanil fungicide. Neem oil can also be effective. Remove severely infected leaves.",
        "prevention": "Plant resistant varieties. Ensure proper spacing for air circulation. Water at base of plants. Avoid late planting.",
        "crop": "Squash",
        "category": "fungal",
    },

    # ── Strawberry ────────────────────────────────────────────────────
    "Strawberry___Leaf_scorch": {
        "severity_threshold": 65,
        "treatment": "Apply copper-based fungicides at first sign of disease. Remove and destroy severely infected leaves. Improve air circulation.",
        "prevention": "Use certified disease-free plants. Renovate beds after harvest. Avoid overhead irrigation. Plant at proper spacing.",
        "crop": "Strawberry",
        "category": "fungal",
    },
    "Strawberry___healthy": {
        "severity_threshold": 95,
        "treatment": "No treatment needed. Plant is healthy.",
        "prevention": "Continue proper bed management, mulching, runner removal, and balanced fertilization.",
        "crop": "Strawberry",
        "category": "healthy",
    },

    # ── Tomato ────────────────────────────────────────────────────────
    "Tomato___Bacterial_spot": {
        "severity_threshold": 70,
        "treatment": "Spray copper-based bactericides (Copper hydroxide 77% WDG) at 1-2 lb/acre. Remove and destroy infected plant parts. Avoid overhead irrigation.",
        "prevention": "Use certified disease-free seeds. Practice crop rotation (3-4 years). Ensure proper plant spacing for air circulation. Mulch to prevent soil splash.",
        "crop": "Tomato",
        "category": "bacterial",
    },
    "Tomato___Early_blight": {
        "severity_threshold": 65,
        "treatment": "Apply chlorothalonil (2 lb/acre) or mancozeb fungicide at 7-10 day intervals. Remove lower infected leaves. Apply at first sign of disease.",
        "prevention": "Rotate crops every 2-3 years. Remove plant debris. Mulch deeply. Choose resistant varieties (e.g., 'Mountain Pride'). Avoid drought stress.",
        "crop": "Tomato",
        "category": "fungal",
    },
    "Tomato___Late_blight": {
        "severity_threshold": 60,
        "treatment": "Apply mancozeb + metalaxyl or chlorothalonil fungicide immediately. Destroy infected plants by burning or bagging. Spray every 5-7 days in wet weather.",
        "prevention": "Plant certified disease-free seed potatoes. Ensure good air circulation. Avoid overhead watering. Scout fields regularly during cool, wet weather.",
        "crop": "Tomato",
        "category": "oomycete",
    },
    "Tomato___Leaf_Mold": {
        "severity_threshold": 70,
        "treatment": "Apply copper fungicides or chlorothalonil. Improve greenhouse ventilation. Remove lower leaves to reduce humidity around plants.",
        "prevention": "Use resistant varieties. Maintain relative humidity below 85%. Space plants properly. Avoid wetting foliage during irrigation.",
        "crop": "Tomato",
        "category": "fungal",
    },
    "Tomato___Septoria_leaf_spot": {
        "severity_threshold": 65,
        "treatment": "Apply azoxystrobin or chlorothalonil fungicide at 7-day intervals. Remove and destroy infected leaves. Avoid working in wet fields.",
        "prevention": "Rotate crops (2-3 years). Mulch to prevent soil splash. Use drip irrigation. Remove volunteer tomato plants.",
        "crop": "Tomato",
        "category": "fungal",
    },
    "Tomato___Spider_mites Two-spotted_spider_mite": {
        "severity_threshold": 75,
        "treatment": "Apply neem oil spray or insecticidal soap. Release predatory mites (Phytoseiulus persimilis). Spray with water to knock off mites.",
        "prevention": "Avoid drought stress - keep plants well watered. Remove heavily infested leaves. Encourage beneficial insects. Avoid excessive nitrogen.",
        "crop": "Tomato",
        "category": "pest",
    },
    "Tomato___Target_Spot": {
        "severity_threshold": 65,
        "treatment": "Apply mancozeb or copper fungicides. Remove infected leaves. Apply at first sign of concentric lesions on leaves.",
        "prevention": "Plant resistant varieties. Practice crop rotation. Avoid overhead irrigation. Maintain proper plant spacing.",
        "crop": "Tomato",
        "category": "fungal",
    },
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus": {
        "severity_threshold": 80,
        "treatment": "No cure available. Remove and destroy infected plants immediately. Control whitefly vectors with pyriproxyfen or buprofezin sprays.",
        "prevention": "Use TYLCV-resistant varieties. Install yellow sticky traps. Control whiteflies with reflective mulches. Remove weeds that host whiteflies.",
        "crop": "Tomato",
        "category": "viral",
    },
    "Tomato___Tomato_mosaic_virus": {
        "severity_threshold": 75,
        "treatment": "No chemical control. Remove infected plants immediately. Disinfect tools with 10% bleach solution or milk.",
        "prevention": "Use certified virus-free seeds. Wash hands before handling plants. Disinfect greenhouse surfaces. Avoid smoking near plants.",
        "crop": "Tomato",
        "category": "viral",
    },
    "Tomato___healthy": {
        "severity_threshold": 95,
        "treatment": "No treatment needed. Plant is healthy.",
        "prevention": "Continue current best practices: proper watering, balanced fertilization, regular scouting for pests and diseases.",
        "crop": "Tomato",
        "category": "healthy",
    },

    # ── Fallback ──────────────────────────────────────────────────────
    "unknown": {
        "severity_threshold": 70,
        "treatment": "Consult with local agricultural extension office for diagnosis and treatment recommendations specific to your region.",
        "prevention": "Maintain good agricultural practices: crop rotation, proper spacing, balanced nutrition, and regular field scouting.",
        "crop": "Unknown",
        "category": "unknown",
    },
}


# =============================================================================
# MODEL LOADING (TensorFlow/Keras)
# =============================================================================

disease_model = None
class_names = None
class_names_json = None


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


def find_best_disease_key(predicted_class: str) -> str:
    """
    Match model output class name to our knowledge base.
    Handles slight naming variations between datasets.
    """
    # Exact match
    if predicted_class in DISEASE_KNOWLEDGE:
        return predicted_class

    # Normalized match (lowercase, strip spaces)
    norm = predicted_class.strip().lower().replace(" ", "_")
    for key in DISEASE_KNOWLEDGE:
        if key.lower().replace(" ", "_") == norm:
            return key

    # Fuzzy match — check if the predicted class is a substring
    for key in DISEASE_KNOWLEDGE:
        if predicted_class.replace(" ", "") in key.replace(" ", ""):
            return key
        if key.replace(" ", "") in predicted_class.replace(" ", ""):
            return key

    return "unknown"


def load_disease_model():
    """Load the TensorFlow/Keras disease detection model."""
    global disease_model, class_names, class_names_json

    print(f"[DEBUG] MODEL_DIR: {MODEL_DIR}")
    print(f"[DEBUG] CWD: {os.getcwd()}")
    
    # Try multiple model filenames
    model_candidates = [
        os.path.join(MODEL_DIR, "plant_disease_model.keras"),  # Larger pre-trained model
        os.path.join(MODEL_DIR, "trained_plant_disease_model.keras"),  # Our trained model
        os.path.join(MODEL_DIR, "trained_model.keras"),
    ]
    
    model_path = None
    for mp in model_candidates:
        if os.path.exists(mp):
            model_path = mp
            print(f"[DEBUG] Found model at: {model_path}")
            break
    
    print(f"[DEBUG] model_path: {model_path}")
    class_names_path = os.path.join(MODEL_DIR, "class_names.json")

    if model_path is None or not os.path.exists(model_path):
        print(f"[WARN] Disease model not found")
        print("  Using mock predictions for disease detection.")
        print("  To enable real predictions:")
        print("  1. Train the model using train_on_colab.py")
        print("  2. Place trained_plant_disease_model.keras in ml-backend/disease_model/")
        disease_model = None
        return

    try:
        import tensorflow as tf

        disease_model = tf.keras.models.load_model(model_path)
        print(f"[OK] Disease model loaded from {model_path}")

        # Load class names
        if os.path.exists(class_names_path):
            with open(class_names_path, "r") as f:
                class_names_json = json.load(f)
            class_names = class_names_json.get("class_names", []) if isinstance(class_names_json, dict) else class_names_json
            print(f"[OK] Loaded {len(class_names)} disease classes")
        else:
            # Default PlantVillage class names (alphabetical order from dataset)
            class_names = [
                "Apple___Apple_scab",
                "Apple___Black_rot",
                "Apple___Cedar_apple_rust",
                "Apple___healthy",
                "Blueberry___healthy",
                "Cherry_(including_sour)___Powdery_mildew",
                "Cherry_(including_sour)___healthy",
                "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot",
                "Corn_(maize)___Common_rust_",
                "Corn_(maize)___Northern_Leaf_Blight",
                "Corn_(maize)___healthy",
                "Grape___Black_rot",
                "Grape___Esca_(Black_Measles)",
                "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)",
                "Grape___healthy",
                "Orange___Haunglongbing_(Citrus_greening)",
                "Peach___Bacterial_spot",
                "Peach___healthy",
                "Pepper,_bell___Bacterial_spot",
                "Pepper,_bell___healthy",
                "Potato___Early_blight",
                "Potato___Late_blight",
                "Potato___healthy",
                "Raspberry___healthy",
                "Soybean___healthy",
                "Squash___Powdery_mildew",
                "Strawberry___Leaf_scorch",
                "Strawberry___healthy",
                "Tomato___Bacterial_spot",
                "Tomato___Early_blight",
                "Tomato___Late_blight",
                "Tomato___Leaf_Mold",
                "Tomato___Septoria_leaf_spot",
                "Tomato___Spider_mites Two-spotted_spider_mite",
                "Tomato___Target_Spot",
                "Tomato___Tomato_Yellow_Leaf_Curl_Virus",
                "Tomato___Tomato_mosaic_virus",
                "Tomato___healthy",
            ]
            print(f"[OK] Using default {len(class_names)} PlantVillage class names")

        print(f"[OK] Model input shape: {disease_model.input_shape}")

    except Exception as e:
        print(f"[ERROR] Error loading disease model: {e}")
        disease_model = None


@app.on_event("startup")
async def startup_event():
    load_disease_model()


# =============================================================================
# API ROUTES
# =============================================================================

@app.get("/")
def root():
    return {
        "message": "Smart Agri AI - Crop Disease Detection API v3.0 (TensorFlow)",
        "status": "running",
        "disease_model_loaded": disease_model is not None,
        "num_classes": len(class_names) if class_names else 0,
        "framework": "tensorflow",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "disease_model_loaded": disease_model is not None,
        "crop_model_loaded": True,
    }


# =============================================================================
# DISEASE DETECTION ENDPOINT
# =============================================================================

MOCK_DISEASE_RESULTS = {
    "default": {
        "disease": "Tomato — Early Blight",
        "confidence": 87,
        "severity": "Moderate",
        "treatment": "Apply chlorothalonil (2 lb/acre) or mancozeb fungicide at 7-10 day intervals. Remove lower infected leaves. Apply at first sign of disease.",
        "prevention": "Rotate crops every 2-3 years. Remove plant debris. Mulch deeply. Choose resistant varieties (e.g., 'Mountain Pride'). Avoid drought stress.",
        "crop": "Tomato",
        "category": "fungal",
    }
}


def format_disease_name(raw_name: str) -> str:
    """Convert class name like 'Tomato___Early_blight' to 'Tomato — Early Blight'."""
    if "___" in raw_name:
        parts = raw_name.split("___")
        crop = parts[0].replace("_", " ")
        disease = parts[1].replace("_", " ").title()
        return f"{crop} — {disease}"
    return raw_name.replace("_", " ").title()



# ── Non-plant detection constants ────────────────────────────────────────────
# The model was trained ONLY on plant leaf images (PlantVillage dataset).
# Non-plant images may produce confident but WRONG predictions.
# We use confidence + entropy heuristics to catch uncertain/unusual inputs.

MIN_CONFIDENCE = 40.0      # Minimum confidence threshold for any prediction
MAX_ENTROPY = 3.3          # Max entropy (~log(38)=3.64 means uniform = confused)
MIN_ENTROPY = 0.8          # Min entropy - extremely peaked = suspicious
TOP3_MIN_SUM = 65.0       # Top-3 must account for at least 65% of probability


def is_not_a_plant(predictions_array: np.ndarray, top_confidence: float) -> tuple[bool, str]:
    """
    Detect if the uploaded image is NOT a plant using prediction distribution analysis.
    """
    probs = predictions_array.astype(np.float64)
    
    # Calculate entropy (uncertainty measure)
    probs_clipped = np.clip(probs, 1e-10, 1.0)
    entropy = -float(np.sum(probs_clipped * np.log(probs_clipped)))
    
    # Top-3 sum
    top3_sum = float(np.sum(np.sort(probs)[::-1][:3])) * 100
    top3_indices = np.argsort(probs)[::-1][:3]
    top3_classes = [class_names[i] if class_names and i < len(class_names) else f"Class_{i}" for i in top3_indices]
    
    # Check 1: Low confidence
    if top_confidence < MIN_CONFIDENCE:
        return True, f"Image does not appear to be a plant leaf (confidence: {top_confidence:.1f}% < {MIN_CONFIDENCE}%)."
    
    # Check 2: Very high entropy (uniform distribution = confused)
    if entropy > MAX_ENTROPY:
        return True, f"Model cannot match image to any known plant disease pattern (entropy: {entropy:.2f})."
    
    # Check 3: Extremely low entropy (all probability in one class) - may indicate non-plant
    if entropy < MIN_ENTROPY and top_confidence < 60:
        return True, f"Suspicious prediction pattern - image may not be a plant."
    
    # Check 4: Top-3 too spread (uncertain)
    if top3_sum < TOP3_MIN_SUM:
        return True, f"Model is uncertain about the image content (combined confidence: {top3_sum:.1f}% < {TOP3_MIN_SUM}%)."
    
    return False, ""


def predict_disease_from_image(image_bytes: bytes) -> dict:
    """Run disease prediction using TensorFlow model with non-plant rejection."""
    if disease_model is None:
        result = MOCK_DISEASE_RESULTS["default"].copy()
        result["is_mock"] = True
        result["success"] = True
        return result

    import tensorflow as tf
    from PIL import Image as PILImage

    # Get expected input size from model
    input_shape = disease_model.input_shape
    img_size = input_shape[1] if input_shape[1] else 256

    # Load and preprocess image
    image = PILImage.open(io.BytesIO(image_bytes)).convert("RGB")
    image = image.resize((img_size, img_size))
    img_array = np.array(image, dtype=np.float32) / 255.0  # Normalize to [0,1]
    img_array = np.expand_dims(img_array, axis=0)  # Add batch dimension

    # Predict
    predictions = disease_model.predict(img_array, verbose=0)
    predicted_idx = int(np.argmax(predictions[0]))
    confidence_value = float(predictions[0][predicted_idx]) * 100

    # ── Non-plant rejection gate ──────────────────────────────────────────────
    not_plant, reason = is_not_a_plant(predictions[0], confidence_value)
    if not_plant:
        return {
            "success": False,
            "is_plant": False,
            "error": "not_a_plant",
            "message": "The uploaded image does not appear to be a plant leaf or crop image.",
            "detail": reason,
            "suggestion": "Please upload a clear, close-up photo of a plant leaf, stem, or fruit showing the affected area.",
        }

    # Map to class name
    if class_names and predicted_idx < len(class_names):
        predicted_class = class_names[predicted_idx]
    else:
        predicted_class = "unknown"

    # Look up disease knowledge
    disease_key = find_best_disease_key(predicted_class)
    disease_info = DISEASE_KNOWLEDGE.get(disease_key, DISEASE_KNOWLEDGE["unknown"])
    severity = get_severity(confidence_value, disease_key)

    # Get top-3 predictions
    top3_indices = np.argsort(predictions[0])[::-1][:3]
    top3 = []
    for idx in top3_indices:
        cls_name = class_names[idx] if class_names and idx < len(class_names) else f"Class_{idx}"
        top3.append({
            "disease": format_disease_name(cls_name),
            "confidence": round(float(predictions[0][idx]) * 100, 2),
        })

    return {
        "success": True,
        "is_plant": True,
        "disease": format_disease_name(predicted_class),
        "raw_class": predicted_class,
        "confidence": round(confidence_value, 2),
        "severity": severity,
        "treatment": disease_info["treatment"],
        "prevention": disease_info["prevention"],
        "crop": disease_info.get("crop", "Unknown"),
        "category": disease_info.get("category", "unknown"),
        "top_predictions": top3,
        "is_mock": False,
    }



@app.post("/predict/disease")
async def predict_disease(file: UploadFile = File(...)):
    """Upload a crop/leaf image and get disease detection results."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Please upload an image file")

    try:
        contents = await file.read()
        result = predict_disease_from_image(contents)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")


# =============================================================================
# CROP RECOMMENDATION ENDPOINT (unchanged)
# =============================================================================

class CropRecommendationRequest(BaseModel):
    nitrogen: float = Field(..., ge=0, le=200, description="Nitrogen content (kg/ha)")
    phosphorus: float = Field(..., ge=0, le=200, description="Phosphorus content (kg/ha)")
    potassium: float = Field(..., ge=0, le=200, description="Potassium content (kg/ha)")
    ph: float = Field(..., ge=0, le=14, description="Soil pH level")
    region: Optional[str] = Field(None, description="Region name")


MOCK_CROP_TEMPLATES = [
    {"name": "Rice", "icon": "🌾", "suitable": "Irrigated lowland areas", "season": "Kharif (Jun-Oct)"},
    {"name": "Wheat", "icon": "🌾", "suitable": "Northern plains with cool climate", "season": "Rabi (Nov-Apr)"},
    {"name": "Maize", "icon": "🌽", "suitable": "Well-drained fertile soils", "season": "Kharif/Rabi"},
    {"name": "Cotton", "icon": "🌿", "suitable": "Black soil regions", "season": "Kharif (Apr-Oct)"},
    {"name": "Groundnut", "icon": "🥜", "suitable": "Sandy loam soils", "season": "Kharif (Jun-Oct)"},
    {"name": "Soybean", "icon": "🫘", "suitable": "Well-drained loamy soils", "season": "Kharif (Jun-Oct)"},
    {"name": "Potato", "icon": "🥔", "suitable": "Cool climate, loose soil", "season": "Rabi (Oct-Mar)"},
    {"name": "Barley", "icon": "🌾", "suitable": "Northern hills and plains", "season": "Rabi (Nov-Apr)"},
    {"name": "Pulses", "icon": "🫘", "suitable": "Semi-arid regions", "season": "Rabi (Oct-Mar)"},
    {"name": "Millets", "icon": "🌾", "suitable": "Drought-prone areas", "season": "Kharif (Jun-Sep)"},
    {"name": "Mustard", "icon": "🌼", "suitable": "Northern plains", "season": "Rabi (Oct-Mar)"},
]


def get_mock_predictions(n: float, p: float, k: float, ph: float, region: str) -> List[dict]:
    np.random.seed(int(n + p + k + ph))
    num_crops = np.random.randint(2, 5)
    selected = np.random.choice(len(MOCK_CROP_TEMPLATES), num_crops, replace=False)

    base_conf = min(95, max(60, 80 + (ph - 6) * 5))

    results = []
    for i, idx in enumerate(selected):
        template = MOCK_CROP_TEMPLATES[idx]
        conf = base_conf - i * 8 + np.random.uniform(-5, 5)
        results.append({
            **template,
            "confidence": round(min(99, max(50, conf)), 1),
        })

    results.sort(key=lambda x: x["confidence"], reverse=True)
    return results


@app.post("/predict/crop")
def predict_crop(request: CropRecommendationRequest):
    crops = get_mock_predictions(
        request.nitrogen,
        request.phosphorus,
        request.potassium,
        request.ph,
        request.region or "Unknown",
    )

    if request.ph < 6.0:
        advice = "Soil is acidic. Consider adding lime to raise pH for better nutrient availability."
    elif request.ph > 7.5:
        advice = "Soil is alkaline. Add organic matter or gypsum to improve conditions."
    else:
        advice = "pH levels are optimal for most crops. Maintain with regular organic amendments."

    return {
        "success": True,
        "recommendations": crops,
        "soil_analysis": {
            "nitrogen": request.nitrogen,
            "phosphorus": request.phosphorus,
            "potassium": request.potassium,
            "ph": request.ph,
            "region": request.region,
        },
        "ai_advice": advice,
    }


# =============================================================================
# CLASSES INFO ENDPOINT (new)
# =============================================================================

@app.get("/classes")
def get_classes():
    """Return all supported disease classes."""
    return {
        "num_classes": len(class_names) if class_names else 0,
        "class_names": class_names or [],
        "model_loaded": disease_model is not None,
    }


# =============================================================================
# MAP INTERACTIVE - WEATHER + CROP RECOMMENDATION ENDPOINT
# =============================================================================

class LocationRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)


def get_weather_from_coordinates(lat: float, lng: float) -> dict:
    """Fetch weather data from Open-Meteo API (free, no API key required)."""
    import urllib.request
    import json
    
    url = (
        f"https://api.open-meteo.com/v1/forecast"
        f"?latitude={lat}&longitude={lng}"
        f"&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,rain"
        f"&daily=temperature_2m_max,temperature_2m_min,rain_sum"
        f"&timezone=auto&forecast_days=7"
    )
    
    try:
        with urllib.request.urlopen(url, timeout=10) as response:
            data = json.loads(response.read().decode())
        
        current = data.get("current", {})
        daily = data.get("daily", {})
        
        weather_codes = {
            0: ("Clear sky", "☀️"),
            1: ("Mainly clear", "🌤️"),
            2: ("Partly cloudy", "⛅"),
            3: ("Overcast", "☁️"),
            45: ("Foggy", "🌫️"),
            51: ("Light drizzle", "🌧️"),
            53: ("Moderate drizzle", "🌧️"),
            61: ("Slight rain", "🌧️"),
            63: ("Moderate rain", "🌧️"),
            65: ("Heavy rain", "🌧️"),
            80: ("Rain showers", "🌦️"),
            95: ("Thunderstorm", "⛈️"),
        }
        
        code = current.get("weather_code", 0)
        condition, icon = weather_codes.get(code, ("Unknown", "❓"))
        
        return {
            "success": True,
            "temperature": current.get("temperature_2m", 0),
            "feels_like": current.get("apparent_temperature", 0),
            "humidity": current.get("relative_humidity_2m", 0),
            "wind_speed": current.get("wind_speed_10m", 0),
            "rain": current.get("rain", 0),
            "condition": condition,
            "icon": icon,
            "forecast": {
                "high": daily.get("temperature_2m_max", [0] * 7),
                "low": daily.get("temperature_2m_min", [0] * 7),
                "rain": daily.get("rain_sum", [0] * 7),
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "temperature": 28,
            "humidity": 65,
            "condition": "Data unavailable",
            "icon": "❓",
        }


def suggest_crops(temp: float, humidity: float, region: str = "") -> list:
    """
    Recommend crops based on temperature and humidity conditions.
    Returns top 3 suitable crops with confidence scores.
    """
    recommendations = []
    
    if temp >= 25 and humidity >= 70:
        recommendations.append({
            "name": "Rice",
            "icon": "🌾",
            "confidence": 95,
            "reason": "High temperature and humidity are ideal for rice cultivation",
            "season": "Kharif (Jun-Oct)",
            "water_need": "High",
        })
        recommendations.append({
            "name": "Sugarcane",
            "icon": "🎋",
            "confidence": 88,
            "reason": "Thrives in warm, humid conditions with ample rainfall",
            "season": "Year-round",
            "water_need": "Very High",
        })
        recommendations.append({
            "name": "Jute",
            "icon": "🧵",
            "confidence": 82,
            "reason": "Prefers hot, humid climate with high rainfall",
            "season": "Kharif (Mar-Jun)",
            "water_need": "High",
        })
    
    elif temp >= 20 and temp < 30 and humidity >= 50:
        recommendations.append({
            "name": "Wheat",
            "icon": "🌾",
            "confidence": 94,
            "reason": "Cool, moderate climate ideal for wheat grain development",
            "season": "Rabi (Nov-Apr)",
            "water_need": "Moderate",
        })
        recommendations.append({
            "name": "Barley",
            "icon": "🌾",
            "confidence": 89,
            "reason": "Tolerates cool climate with moderate humidity",
            "season": "Rabi (Nov-Apr)",
            "water_need": "Low",
        })
        recommendations.append({
            "name": "Chickpea",
            "icon": "🫘",
            "confidence": 85,
            "reason": "Thrives in semi-arid conditions with cool temperatures",
            "season": "Rabi (Oct-Mar)",
            "water_need": "Low",
        })
    
    elif temp >= 30 and humidity < 60:
        recommendations.append({
            "name": "Cotton",
            "icon": "🌿",
            "confidence": 92,
            "reason": "Requires warm, dry climate with good sun exposure",
            "season": "Kharif (Apr-Oct)",
            "water_need": "Moderate",
        })
        recommendations.append({
            "name": "Maize",
            "icon": "🌽",
            "confidence": 87,
            "reason": "Heat-loving crop suitable for sunny, less humid areas",
            "season": "Kharif/Rabi",
            "water_need": "Moderate",
        })
        recommendations.append({
            "name": "Millets",
            "icon": "🌾",
            "confidence": 91,
            "reason": "Drought-tolerant, perfect for hot and dry conditions",
            "season": "Kharif (Jun-Sep)",
            "water_need": "Very Low",
        })
    
    elif temp >= 15 and temp < 25:
        recommendations.append({
            "name": "Potato",
            "icon": "🥔",
            "confidence": 93,
            "reason": "Cool climate promotes tuber development",
            "season": "Rabi (Oct-Mar)",
            "water_need": "Moderate",
        })
        recommendations.append({
            "name": "Tomato",
            "icon": "🍅",
            "confidence": 88,
            "reason": "Moderate temperature ideal for fruit setting",
            "season": "Year-round",
            "water_need": "Moderate",
        })
        recommendations.append({
            "name": "Onion",
            "icon": "🧅",
            "confidence": 85,
            "reason": "Prefers cool weather during bulb formation",
            "season": "Rabi (Oct-Mar)",
            "water_need": "Low",
        })
    
    else:
        recommendations.append({
            "name": "Maize",
            "icon": "🌽",
            "confidence": 80,
            "reason": "Versatile crop adapting to various conditions",
            "season": "Kharif/Rabi",
            "water_need": "Moderate",
        })
        recommendations.append({
            "name": "Soybean",
            "icon": "🫘",
            "confidence": 76,
            "reason": "Tolerates temperature variations well",
            "season": "Kharif (Jun-Oct)",
            "water_need": "Moderate",
        })
        recommendations.append({
            "name": "Groundnut",
            "icon": "🥜",
            "confidence": 72,
            "reason": "Suitable for warm climate with moderate moisture",
            "season": "Kharif (Jun-Oct)",
            "water_need": "Low",
        })
    
    return recommendations


@app.post("/analyze/location")
def analyze_location(request: LocationRequest):
    """
    Analyze a clicked location on the map:
    1. Fetch weather data from Open-Meteo API
    2. Generate crop recommendations based on conditions
    Returns weather info + 3 recommended crops
    """
    lat = request.latitude
    lng = request.longitude
    
    weather = get_weather_from_coordinates(lat, lng)
    temp = weather.get("temperature", 25)
    humidity = weather.get("humidity", 60)
    
    region = f"{lat:.2f}°N, {abs(lng):.2f}°{'E' if lng >= 0 else 'W'}"
    crops = suggest_crops(temp, humidity, region)
    
    for i, crop in enumerate(crops):
        crop["rank"] = i + 1
    
    farming_tips = []
    if humidity > 75:
        farming_tips.append("High humidity - monitor for fungal diseases")
    if temp > 35:
        farming_tips.append("Heat stress risk - irrigate early morning or evening")
    if weather.get("rain", 0) > 5:
        farming_tips.append("Recent rainfall - delay pesticide application")
    if temp >= 20 and temp <= 30:
        farming_tips.append("Ideal temperature for most field operations")
    
    return {
        "success": True,
        "location": {
            "latitude": round(lat, 4),
            "longitude": round(lng, 4),
            "region": region,
        },
        "weather": weather,
        "crops": crops,
        "farming_tips": farming_tips,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
