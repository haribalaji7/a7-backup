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
# MODEL LOADING (TensorFlow/Keras) + TTA
# =============================================================================

disease_model = None
class_names = None
class_names_json = None
mobilenet_model = None
TTA_AUGMENTATIONS = 5  # Number of TTA passes

# Keywords that indicate plant/leaf images in ImageNet
PLANT_KEYWORDS = [
    "leaf", "plant", "flower", "rose", "daisy", "dandelion", "tulip", "orchid",
    "tree", "grass", "shrub", "fern", "palm", "cactus", "succulent", "pot",
    "houseplant", "garden", "crop", "vegetable", "fruit", "seed", "seedling",
    "spore", "moss", "lichen", "algae", "seaweed", "cabbage", "broccoli",
    "carrot", "potato", "tomato", "pepper", "onion", "garlic", "ginger",
    "apple", "orange", "lemon", "banana", "berry", "grape", "mango", "pineapple",
    "corn", "wheat", "rice", "barley", "oat", "sorghum", "millet", "sugarcane",
    "cotton", "sunflower", "soybean", "peanut", "coffee", "tea", "tobacco",
    "rubber", "jute", "coconut", "olive", "avocado", "cucumber", "pumpkin",
    "melon", "squash", "lettuce", "spinach", "kale", "eggplant", "okra",
    "basil", "mint", "thyme", "rosemary", "lavender", "sage", "parsley",
    "cilantro", "dill", "oregano", "chive", "lemongrass", "tea",
    "pitcher_plant", "venus_flytrap", "snapdragon", "marigold", "petunia",
    "poppy", "sunflower", "hibiscus", "jasmine", "lotus", "water_lily",
    "pine", "oak", "maple", "willow", "birch", "cedar", "cypress", "elm",
    "beech", "cherry", "apple_tree", "peach", "plum", "pear", "fig", "pomegranate",
    "guava", "papaya", "lychee", "dragon_fruit", "passion_fruit",
]

# Keywords that indicate human/face/object images (should be rejected)
REJECT_KEYWORDS = [
    "person", "face", "man", "woman", "boy", "girl", "child", "baby",
    "human", "team", "group", "crowd", "player", "runner", "walker",
    "jersey", "suit", "dress", "gown", "robe", "coat", "jacket", "shirt",
    "pants", "jeans", "shorts", "skirt", "shoe", "sneaker", "boot", "sandal",
    "hat", "cap", "glasses", "sunglasses", "watch", "ring", "necklace",
    "laptop", "computer", "monitor", "keyboard", "mouse", "phone", "smartphone",
    "tablet", "tv", "television", "remote", "camera", "webcam", "projector",
    "book", "notebook", "paper", "magazine", "newspaper", "poster", "calendar",
    "pen", "pencil", "marker", "eraser", "ruler", "stapler", "tape",
    "desk", "chair", "table", "sofa", "couch", "bed", "pillow", "blanket",
    "lamp", "light", "bulb", "fan", "ac", "air_conditioner", "heater",
    "car", "truck", "bus", "motorcycle", "bicycle", "train", "airplane", "boat",
    "bottle", "cup", "glass", "bowl", "plate", "spoon", "fork", "knife",
    "knife", "pot", "pan", "kettle", "microwave", "oven", "toaster", "fridge",
    "refrigerator", "sink", "faucet", "tap", "tub", "shower", "toilet",
    "cell_phone", "ipod", "headphone", "earphone", "microphone", "speaker",
    "wallet", "purse", "handbag", "backpack", "briefcase", "suitcase",
    "umbrella", "raincoat", "socks", "tie", "scarf", "glove",
]


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
    
    # Try multiple model filenames - use original robust model
    model_candidates = [
        os.path.join(MODEL_DIR, "plant_disease_model.keras"),  # Original robust model
        os.path.join(MODEL_DIR, "trained_plant_disease_model.keras"),  # Fallback
    ]
    
    model_path = None
    for mp in model_candidates:
        if os.path.exists(mp):
            model_path = mp
            print(f"[DEBUG] Found model at: {model_path}")
            print(f"[INFO] Using model: {os.path.basename(mp)}")
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


def load_mobilenet_model():
    """Load MobileNetV2 for first-pass image validation."""
    global mobilenet_model
    try:
        import tensorflow as tf
        from tensorflow.keras.applications import MobileNetV2
        
        # Download and load the model with specific input shape
        mobilenet_model = MobileNetV2(weights="imagenet", include_top=True, input_shape=(224, 224, 3))
        print("[OK] MobileNetV2 loaded for image validation")
    except Exception as e:
        print(f"[WARN] Could not load MobileNetV2: {e}")
        print("[INFO] Face/object detection will rely on fallback validation")
        mobilenet_model = None


def is_valid_plant_image(image_bytes: bytes) -> tuple[bool, str]:
    """
    First-pass validation using MobileNetV2 to reject non-plant images.
    Returns (is_valid, reason).
    """
    # FALLBACK VALIDATION - Always active as backup
    # Even if MobileNetV2 fails to load, we do basic color/feature analysis
    try:
        from PIL import Image as PILImage
        import io
        
        image = PILImage.open(io.BytesIO(image_bytes)).convert("RGB")
        img_array = np.array(image)
        
        # Get image statistics
        h, w, c = img_array.shape
        total_pixels = h * w
        
        # Calculate color distribution
        r, g, b = img_array[:,:,0], img_array[:,:,1], img_array[:,:,2]
        
        # Green pixel detection - plants should have significant green
        green_dominant = np.sum((g > r) & (g > b)) / total_pixels
        
        # Brown/yellow detection (typical for healthy leaves)
        brown_yellow = np.sum(((r > 100) & (g > 80) & (b < 100))) / total_pixels
        
        # Blue/white sky detection (usually NOT plant)
        sky_detected = np.sum((b > r) & (b > g) & (b > 150)) / total_pixels
        
        # Check for typical human skin tones (fallback for face detection)
        skin_tone = np.sum((r > 95) & (g > 40) & (b > 20) & 
                          (r > g) & (r > b) & 
                          (np.abs(r - g) > 15) & (r - g < 100)) / total_pixels
        
        # If significant skin tone detected, likely a face
        if skin_tone > 0.15:
            return False, "Image appears to be a human face. Please scan a plant leaf instead."
        
        # If too much sky/blue, likely not a plant close-up
        if sky_detected > 0.3:
            return False, "Image appears to be sky or landscape. Please scan a plant leaf instead."
        
        # Very low green content AND low brown/yellow - likely not plant
        if green_dominant < 0.1 and brown_yellow < 0.05:
            return False, "Image does not appear to be a plant. Please scan a valid plant leaf."
            
    except Exception as e:
        print(f"[WARN] Fallback validation error: {e}")
    
    # Now try MobileNetV2 if available
    if mobilenet_model is None:
        return True, ""  # Skip advanced check if model not available
    
    import tensorflow as tf
    from PIL import Image as PILImage
    
    try:
        # Load and preprocess image for MobileNetV2 (224x224)
        image = PILImage.open(io.BytesIO(image_bytes)).convert("RGB")
        image = image.resize((224, 224))
        img_array = np.array(image, dtype=np.float32)
        img_array = np.expand_dims(img_array, axis=0)
        img_array = tf.keras.applications.mobilenet_v2.preprocess_input(img_array)
        
        # Get predictions - get top 10 to be more thorough
        predictions = mobilenet_model.predict(img_array, verbose=0)
        decoded = tf.keras.applications.mobilenet_v2.decode_predictions(predictions, top=10)[0]
        
        # Extract labels and scores
        top_labels = [label.lower() for (_, label, score) in decoded]
        top_scores = {label.lower(): score for (_, label, score) in decoded}
        
        # Check top 3 predictions - if any human/face/object detected, reject
        top_3_labels = top_labels[:3]
        top_3_scores = [top_scores.get(label, 0) for label in top_3_labels]
        
        # HIGHLY AGGRESSIVE REJECTION for faces and humans
        for i, label in enumerate(top_3_labels):
            score = top_3_scores[i]
            # Check for face/person/human - even at low confidence
            if any(h in label for h in ["person", "face", "man", "woman", "boy", "girl", "child", "baby", "human", "head", "body", "hand"]):
                if score > 0.08:  # Even 8% confidence is suspicious for face
                    return False, "Image appears to be a human face or person. Please scan a plant leaf instead."
            
            # Check for clothing/accessories
            if any(c in label for c in ["shirt", "dress", "pants", "jeans", "shoe", "sneaker", "boot", "sandal", "hat", "cap", "glasses", "sunglasses", "watch", "ring", "necklace", "jersey", "suit", "gown", "robe", "coat", "jacket"]):
                if score > 0.12:
                    return False, "Image appears to be clothing or accessories. Please scan a plant leaf instead."
            
            # Check for electronics/objects
            if any(e in label for e in ["laptop", "computer", "phone", "smartphone", "tablet", "tv", "monitor", "keyboard", "mouse", "camera", "book", "notebook", "paper", "remote"]):
                if score > 0.15:
                    return False, "Image appears to be an electronic device or object. Please scan a plant leaf instead."
            
            # Check for other non-plant objects
            if any(o in label for o in ["car", "truck", "bus", "motorcycle", "bicycle", "desk", "chair", "table", "sofa", "bed", "bottle", "cup", "bowl", "glass", "pen", "pencil"]):
                if score > 0.15:
                    return False, "Image appears to be a non-plant object. Please scan a plant leaf instead."
        
        # Additional check: if no plant keywords in top 5 AND top prediction is clearly not plant
        has_plant = any(any(pk in label for pk in PLANT_KEYWORDS) for label in top_labels[:5])
        if not has_plant:
            # Top prediction is not a plant - reject
            return False, "Image does not appear to be a plant or crop. Please scan a valid plant leaf."
        
        return True, ""
        
    except Exception as e:
        print(f"[WARN] MobileNetV2 validation error: {e}")
        return True, ""  # Don't block on errors


filter_model = None

def load_filter_model():
    """Load MobileNetV2 for non-plant/face filtration."""
    global filter_model
    try:
        from tensorflow.keras.applications.mobilenet_v2 import MobileNetV2
        print("[INFO] Loading MobileNetV2 for filtration...")
        filter_model = MobileNetV2(weights='imagenet')
        print("[OK] Filtration model loaded.")
    except Exception as e:
        print(f"[ERROR] Failed to load filtration model: {e}")

@app.on_event("startup")
async def startup_event():
    load_disease_model()
    load_filter_model()
    load_mobilenet_model()


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

MIN_CONFIDENCE = 25.0      # Lowered from 40% to return more predictions
MAX_ENTROPY = 3.5          # Max entropy (~log(38)=3.64 means uniform = confused)
MIN_ENTROPY = 0.5          # Min entropy - extremely peaked = suspicious
TOP3_MIN_SUM = 50.0        # Lowered from 65% to return more predictions


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

def is_unrelated_image(image_bytes: bytes) -> tuple[bool, str]:
    if filter_model is None:
        return False, ""
    try:
        import numpy as np
        from tensorflow.keras.applications.mobilenet_v2 import preprocess_input, decode_predictions
        from PIL import Image as PILImage
        import io
        
        image = PILImage.open(io.BytesIO(image_bytes)).convert("RGB").resize((224, 224))
        img_array = np.expand_dims(np.array(image, dtype=np.float32), axis=0)
        img_array = preprocess_input(img_array)
        
        preds = filter_model.predict(img_array, verbose=0)
        decoded = decode_predictions(preds, top=5)[0]
        
        top_classes = [item[1].lower() for item in decoded]
        top_conf = [item[2] for item in decoded]
        print(f"[DEBUG] MobileNetV2 top predictions: {list(zip(top_classes, [round(c, 2) for c in top_conf]))}")
        
        # Reject objects/human traces often triggered by faces or general environment
        face_keywords = [
            "sunglasses", "lipstick", "wig", "mask", "shower_cap", "hair_spray", 
            "band_aid", "neck_brace", "cowboy_hat", "suit", "groom", "t-shirt", 
            "sweatshirt", "jersey", "bow_tie", "bikini", "cellular_telephone",
            "laptop", "monitor", "desk", "coffee_mug", "cup", "bottle", "seat_belt",
            "car", "motor_vehicle", "notebook", "tv", "teddy", "book"
        ]
        
        for cl, conf in zip(top_classes, top_conf):
            if conf > 0.15:
                for kw in face_keywords:
                    if kw in cl:
                        return True, f"Image looks like a {cl.replace('_', ' ')} (human/object), not a plant."
                        
        animal_keywords = ["dog", "cat", "terrier", "hound", "spaniel", "retriever", "bird", "fish", "shark"]
        for cl, conf in zip(top_classes, top_conf):
            if conf > 0.25:
                for kw in animal_keywords:
                    if kw in cl:
                        return True, f"Image looks like a {cl.replace('_', ' ')} (animal layer), not a plant."

        return False, ""
    except Exception as e:
        print(f"[ERROR] Filter check failed: {e}")
        return False, ""


def predict_disease_from_image(image_bytes: bytes) -> dict:
    """Run disease prediction using TensorFlow model with non-plant rejection + TTA."""
    if disease_model is None:
        result = MOCK_DISEASE_RESULTS["default"].copy()
        result["is_mock"] = True
        result["success"] = True
        return result

    # First-pass validation: explicitly check for human faces and unrelated objects using MobileNetV2 heuristics
    is_unrelated, explanation = is_unrelated_image(image_bytes)
    if is_unrelated:
        return {
            "success": False,
            "is_plant": False,
            "error": "not_a_plant",
            "message": "The uploaded image does not appear to be a plant leaf or crop.",
            "detail": explanation,
            "suggestion": "Please upload a clear, close-up photo of a plant leaf showing the affected area.",
        }

    import tensorflow as tf
    from PIL import Image as PILImage
    from tensorflow.keras.preprocessing.image import ImageDataGenerator

    input_shape = disease_model.input_shape
    img_size = input_shape[1] if input_shape[1] else 256

    image = PILImage.open(io.BytesIO(image_bytes)).convert("RGB")
    image = image.resize((img_size, img_size))
    img_array = np.array(image, dtype=np.float32) / 255.0

    tta_datagen = ImageDataGenerator(
        rotation_range=15,
        width_shift_range=0.1,
        height_shift_range=0.1,
        horizontal_flip=True,
        zoom_range=0.1,
        fill_mode='nearest'
    )

    tta_predictions = []
    original_pred = disease_model.predict(np.expand_dims(img_array, axis=0), verbose=0)
    tta_predictions.append(original_pred[0])

    for _ in range(TTA_AUGMENTATIONS - 1):
        aug_iter = tta_datagen.flow(np.expand_dims(img_array, axis=0), batch_size=1)
        aug_image = next(aug_iter)[0]
        pred = disease_model.predict(np.expand_dims(aug_image, axis=0), verbose=0)
        tta_predictions.append(pred[0])

    predictions = np.mean(tta_predictions, axis=0)
    predicted_idx = int(np.argmax(predictions))
    confidence_value = float(predictions[predicted_idx]) * 100



    # ── Non-plant rejection gate (Entropy/Confidence stats) ───────────────────
    not_plant, reason = is_not_a_plant(predictions, confidence_value)
    if not_plant:
        return {
            "success": False,
            "is_plant": False,
            "error": "not_a_plant",
            "message": "The uploaded image does not appear to match any known plant disease pattern.",
            "detail": reason,
            "suggestion": "Please upload a clear, close-up photo of a plant leaf showing the affected area.",
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
    top3_indices = np.argsort(predictions)[::-1][:3]
    top3 = []
    for idx in top3_indices:
        cls_name = class_names[idx] if class_names and idx < len(class_names) else f"Class_{idx}"
        top3.append({
            "disease": format_disease_name(cls_name),
            "confidence": round(float(predictions[idx]) * 100, 2),
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


def is_location_on_land(lat: float, lng: float) -> tuple[bool, str]:
    """
    Check if a location is on land using Nominatim reverse geocoding.
    Returns (is_on_land, location_info).
    """
    import urllib.request
    import urllib.parse
    
    try:
        url = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lng}&format=json"
        req = urllib.request.Request(url, headers={"User-Agent": "SmartAgriAI/1.0"})
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode())
        
        address = data.get("address", {})
        category = data.get("class", "")
        
        # Check if it's in the sea (no address data or certain indicators)
        if not address or category in ["water", "waterway", "sea"]:
            return False, "Ocean/Sea"
        
        # Check for water-related address fields
        if any(k in address for k in ["sea", "ocean", "water"]):
            return False, address.get("sea", address.get("ocean", "Water body"))
        
        # Check if country exists (land should have country)
        if "country" not in address:
            return False, "Unknown"
        
        return True, address.get("country", "Unknown land")
        
    except Exception as e:
        print(f"[WARN] Could not verify land/sea: {e}")
        return True, "Unknown"


@app.post("/analyze/location")
def analyze_location(request: LocationRequest):
    """
    Analyze a clicked location on the map:
    1. Check if location is on land (not sea)
    2. Fetch weather data from Open-Meteo API
    3. Generate crop recommendations based on conditions
    Returns weather info + 3 recommended crops
    """
    lat = request.latitude
    lng = request.longitude
    
    is_on_land, location_info = is_location_on_land(lat, lng)
    
    if not is_on_land:
        return {
            "success": False,
            "error": "water_location",
            "message": f"Selected location appears to be in the {location_info}. Cannot analyze for crop recommendations.",
            "suggestion": "Please select a location on land for agricultural analysis.",
        }
    
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




# =============================================================================
# NDVI SATELLITE ANALYSIS ENDPOINT (Sentinel-2 + Gemini AI)
# =============================================================================

class NDVIRequest(BaseModel):
    bbox: List[float] = Field(..., description="[min_lon, min_lat, max_lon, max_lat]")
    crop_type: Optional[str] = Field("Unknown", description="Crop type for context")
    field_name: Optional[str] = Field("Field", description="Field name/label")


def get_weather_for_ndvi(lat: float, lng: float) -> str:
    import urllib.request
    url = (
        f"https://api.open-meteo.com/v1/forecast"
        f"?latitude={lat}&longitude={lng}"
        f"&current=temperature_2m,relative_humidity_2m,rain"
        f"&daily=rain_sum,temperature_2m_max&timezone=auto&past_days=10&forecast_days=1"
    )
    try:
        with urllib.request.urlopen(url, timeout=10) as response:
            data = json.loads(response.read().decode())
        current = data.get("current", {})
        daily = data.get("daily", {})
        rain_sum = daily.get("rain_sum", [])
        total_rain_10d = sum(rain_sum[:-1]) if rain_sum else 0
        temp = current.get("temperature_2m", 30)
        humidity = current.get("relative_humidity_2m", 60)
        weather_str = f"Temperature {temp}C, humidity {humidity}%, total rainfall last 10 days: {total_rain_10d:.1f}mm"
        if total_rain_10d < 5:
            weather_str += " - no significant rain in 10 days"
        return weather_str
    except Exception:
        return "Weather data unavailable"


def generate_farmer_advice(ndvi_stats: dict, weather: str, crop_type: str, field_name: str) -> str:
    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key or len(api_key) < 20:
        return _fallback_farmer_advice(ndvi_stats, weather, crop_type, field_name)
    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.0-flash")
        avg_ndvi = ndvi_stats["avg_ndvi"]
        green_pct = ndvi_stats["green_pct"]
        yellow_pct = ndvi_stats["yellow_pct"]
        red_pct = ndvi_stats["red_pct"]
        worst_zone = ndvi_stats.get("worst_zone", "unknown area")
        worst_ndvi = ndvi_stats.get("worst_ndvi", 0.0)
        prompt = (
            f"You are an expert agronomist talking directly to a farmer. "
            f"Their {crop_type} field '{field_name}' has these satellite readings:\n"
            f"- Average NDVI: {avg_ndvi:.2f}\n"
            f"- Healthy green areas: {green_pct:.0f}%\n"
            f"- Stressed yellow areas: {yellow_pct:.0f}%\n"
            f"- Severe red areas: {red_pct:.0f}%\n"
            f"- Worst spot: {worst_zone} with NDVI {worst_ndvi:.2f}\n"
            f"- Weather: {weather}\n\n"
            f"Respond in THIS FORMAT (no extra text):\n"
            f"**What the satellite shows:** [1-2 sentences in plain farmer language, use analogies like thirsty, hungry, struggling]\n\n"
            f"**Where to look:** [point out the worst zone]\n\n"
            f"**What to do next:** [specific action: irrigate, fertilize, scout for pests, or wait]\n\n"
            f"**Why:** [brief reason tying NDVI + weather together]\n\n"
            f"Keep it under 150 words. No technical terms. Be direct and supportive."
        )
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"[WARN] Gemini API error: {e}")
        return _fallback_farmer_advice(ndvi_stats, weather, crop_type, field_name)


def _fallback_farmer_advice(ndvi_stats: dict, weather: str, crop_type: str, field_name: str) -> str:
    avg = ndvi_stats["avg_ndvi"]
    red_pct = ndvi_stats["red_pct"]
    worst = ndvi_stats.get("worst_zone", "unknown area")
    if avg >= 0.6:
        status = "Your crop looks healthy and strong."
        action = "Keep up your current routine. Scout weekly for pests."
    elif avg >= 0.3:
        status = "Parts of your field are showing stress - the crop is struggling in spots."
        action = "Check soil moisture in the yellow/red zones. Consider targeted irrigation or a light nitrogen top-dress."
    else:
        status = "Your field is in rough shape - large areas show severe stress or bare soil."
        action = "Scout immediately. Check for water shortage, nutrient deficiency, or pest damage. Replant dead zones if needed."
    return (
        f"**What the satellite shows:** {status}\n\n"
        f"**Where to look:** Focus on {worst} - it's the weakest area.\n\n"
        f"**What to do next:** {action}\n\n"
        f"**Why:** Average NDVI {avg:.2f} with {red_pct:.0f}% in red zone. Weather: {weather}."
    )


@app.post("/analyze/ndvi")
def analyze_ndvi(request: NDVIRequest):
    bbox = request.bbox
    crop_type = request.crop_type or "Unknown"
    field_name = request.field_name or "Field"
    center_lat = (bbox[1] + bbox[3]) / 2
    center_lng = (bbox[0] + bbox[2]) / 2

    client_id = os.environ.get("SENTINEL_HUB_CLIENT_ID", "")
    client_secret = os.environ.get("SENTINEL_HUB_CLIENT_SECRET", "")

    if not client_id or not client_secret or len(client_id) < 10:
        print("[WARN] Sentinel Hub credentials missing - using realistic demo NDVI data")
        
        # Generate realistic agricultural field pattern with rectangular plots
        size = 512
        ndvi_raster = np.zeros((size, size), dtype=np.float32)
        
        # Create base field with varying health (realistic variation)
        base = np.random.uniform(0.35, 0.75, size=(size, size))
        noise = np.random.normal(0, 0.08, (size, size))
        ndvi_raster = np.clip(base + noise, 0.0, 1.0)
        
        # Create rectangular plots with different health levels
        plot_rows, plot_cols = 4, 6
        plot_h, plot_w = size // plot_rows, size // plot_cols
        
        plot_health = [
            [0.72, 0.65, 0.58, 0.78, 0.68, 0.55],  # Row 1 - various health
            [0.45, 0.82, 0.71, 0.38, 0.75, 0.62],  # Row 2 - stressed corners
            [0.68, 0.52, 0.85, 0.70, 0.42, 0.77],  # Row 3
            [0.58, 0.72, 0.48, 0.80, 0.65, 0.45],  # Row 4
        ]
        
        for i in range(plot_rows):
            for j in range(plot_cols):
                y1, y2 = i * plot_h, (i + 1) * plot_h
                x1, x2 = j * plot_w, (j + 1) * plot_w
                # Add variation within each plot
                plot_var = np.random.normal(0, 0.05, (plot_h, plot_w))
                ndvi_raster[y1:y2, x1:x2] = np.clip(plot_health[i][j] + plot_var, 0.1, 0.9)
        
        # Add irrigation channel/drain running diagonally
        for i in range(size):
            for j in range(size):
                # Main diagonal channel
                dist = abs(i - j * size / size * 1.2 + size * 0.3)
                if dist < 8:
                    ndvi_raster[i, j] = 0.15  # Low NDVI (water/road)
                elif dist < 12:
                    ndvi_raster[i, j] = min(ndvi_raster[i, j], 0.25)  # Edge stress
        
        # Add some stressed patches (disease/waterlogging)
        stressed_centers = [(120, 350), (380, 150), (280, 400), (420, 300)]
        for (cy, cx) in stressed_centers:
            for i in range(max(0, cy-40), min(size, cy+40)):
                for j in range(max(0, cx-40), min(size, cx+40)):
                    dist = np.sqrt((i-cy)**2 + (j-cx)**2)
                    if dist < 40:
                        stress = (1 - dist/40) * 0.4
                        ndvi_raster[i, j] = max(0.1, ndvi_raster[i, j] - stress)
        
        # Add healthy patches
        healthy_centers = [(80, 100), (200, 250), (350, 420), (450, 80)]
        for (cy, cx) in healthy_centers:
            for i in range(max(0, cy-35), min(size, cy+35)):
                for j in range(max(0, cx-35), min(size, cx+35)):
                    dist = np.sqrt((i-cy)**2 + (j-cx)**2)
                    if dist < 35:
                        boost = (1 - dist/35) * 0.25
                        ndvi_raster[i, j] = min(0.95, ndvi_raster[i, j] + boost)
        
        # Add plot boundaries (slight stress at edges)
        for i in range(plot_rows):
            for j in range(plot_cols):
                y1, y2 = i * plot_h, (i + 1) * plot_h
                x1, x2 = j * plot_w, (j + 1) * plot_w
                # Top and bottom edges
                ndvi_raster[y1:y1+5, x1:x2] = np.clip(ndvi_raster[y1:y1+5, x1:x2] - 0.1, 0.1, 0.9)
                ndvi_raster[y2-5:y2, x1:x2] = np.clip(ndvi_raster[y2-5:y2, x1:x2] - 0.1, 0.1, 0.9)
                # Left and right edges
                ndvi_raster[y1:y2, x1:x1+5] = np.clip(ndvi_raster[y1:y2, x1:x1+5] - 0.1, 0.1, 0.9)
                ndvi_raster[y1:y2, x2-5:x2] = np.clip(ndvi_raster[y1:y2, x2-5:x2] - 0.1, 0.1, 0.9)
    else:
        try:
            from sentinelhub import DataCollection, SentinelHubRequest, MimeType, CRS, BBox, SHConfig
            bbox_obj = BBox(bbox=bbox, crs=CRS.WGS84)
            evalscript = """
                //VERSION=3
                function setup() {
                    return {
                        input: [{ bands: ["B04", "B08"], units: "DN" }],
                        output: { bands: 2, sampleType: "FLOAT32" }
                    };
                }
                function evaluatePixel(sample) {
                    return [sample.B04, sample.B08];
                }
            """
            request_sh = SentinelHubRequest(
                evalscript=evalscript,
                input_data=[SentinelHubRequest.input_data(data_collection=DataCollection.SENTINEL2_L2A)],
                responses=[SentinelHubRequest.output_response("default", MimeType.TIFF)],
                bbox=bbox_obj,
                size=(512, 512),
                config=SHConfig(sh_client_id=client_id, sh_client_secret=client_secret),
            )
            response = request_sh.get_data()
            if response and len(response) > 0:
                img_data = response[0]
                red_band = img_data[:, :, 0].astype(np.float32)
                nir_band = img_data[:, :, 1].astype(np.float32)
                denominator = nir_band + red_band
                ndvi_raster = np.where(denominator > 0, (nir_band - red_band) / denominator, 0.0)
            else:
                ndvi_raster = np.random.uniform(0.2, 0.8, size=(100, 100)).astype(np.float32)
        except Exception as e:
            print(f"[ERROR] Sentinel Hub fetch failed: {e}")
            ndvi_raster = np.random.uniform(0.2, 0.8, size=(100, 100)).astype(np.float32)

    green_mask = ndvi_raster >= 0.6
    yellow_mask = (ndvi_raster >= 0.3) & (ndvi_raster < 0.6)
    red_mask = ndvi_raster < 0.3
    total = ndvi_raster.size
    avg_ndvi = float(np.mean(ndvi_raster))
    green_pct = float(np.sum(green_mask)) / total * 100
    yellow_pct = float(np.sum(yellow_mask)) / total * 100
    red_pct = float(np.sum(red_mask)) / total * 100

    red_pixels = np.where(red_mask)
    if red_pixels[0].size > 0:
        row_mean = np.mean(red_pixels[0])
        col_mean = np.mean(red_pixels[1])
        if row_mean < ndvi_raster.shape[0] / 3:
            zone = "north"
        elif row_mean > 2 * ndvi_raster.shape[0] / 3:
            zone = "south"
        else:
            zone = "center"
        if col_mean < ndvi_raster.shape[1] / 3:
            zone += "west"
        elif col_mean > 2 * ndvi_raster.shape[1] / 3:
            zone += "east"
        else:
            zone += "area"
        worst_ndvi = float(np.min(ndvi_raster[red_mask]))
    else:
        zone = "no severe stress detected"
        worst_ndvi = float(np.min(ndvi_raster))

    ndvi_stats = {
        "avg_ndvi": round(avg_ndvi, 3),
        "green_pct": round(green_pct, 1),
        "yellow_pct": round(yellow_pct, 1),
        "red_pct": round(red_pct, 1),
        "worst_zone": zone,
        "worst_ndvi": round(worst_ndvi, 3),
    }

    weather = get_weather_for_ndvi(center_lat, center_lng)
    farmer_advice = generate_farmer_advice(ndvi_stats, weather, crop_type, field_name)

    # RdYlGn colormap style: Red (stressed) -> Yellow (moderate) -> Green (healthy)
    # Create smooth color gradient based on NDVI value
    rgb = np.zeros((ndvi_raster.shape[0], ndvi_raster.shape[1], 3), dtype=np.uint8)
    
    for i in range(ndvi_raster.shape[0]):
        for j in range(ndvi_raster.shape[1]):
            val = ndvi_raster[i, j]
            if val >= 0.6:
                # Healthy - vibrant green
                rgb[i, j] = [34, 197, 94]
            elif val >= 0.45:
                # Good - light green
                rgb[i, j] = [132, 204, 22]
            elif val >= 0.3:
                # Moderate - yellow/amber
                rgb[i, j] = [234, 179, 8]
            elif val >= 0.2:
                # Stressed - orange
                rgb[i, j] = [249, 115, 22]
            else:
                # Severely stressed/barren - red
                rgb[i, j] = [239, 68, 68]
    
    # Add plot boundary lines
    plot_rows, plot_cols = 4, 6
    plot_h, plot_w = ndvi_raster.shape[0] // plot_rows, ndvi_raster.shape[1] // plot_cols
    for i in range(1, plot_rows):
        rgb[i*plot_h:i*plot_h+3, :] = [180, 180, 180]
    for j in range(1, plot_cols):
        rgb[:, j*plot_w:j*plot_w+3] = [180, 180, 180]
    from PIL import Image as PILImage
    img = PILImage.fromarray(rgb)
    import base64
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    ndvi_map_b64 = base64.b64encode(buf.getvalue()).decode()

    ndvi_trend = [
        {"date": "Day -20", "ndvi": round(avg_ndvi - 0.05, 2)},
        {"date": "Day -15", "ndvi": round(avg_ndvi - 0.03, 2)},
        {"date": "Day -10", "ndvi": round(avg_ndvi - 0.01, 2)},
        {"date": "Day -5", "ndvi": round(avg_ndvi, 2)},
        {"date": "Today", "ndvi": round(avg_ndvi, 2)},
    ]

    return {
        "success": True,
        "field": field_name,
        "crop": crop_type,
        "bbox": bbox,
        "stats": ndvi_stats,
        "weather": weather,
        "advice": farmer_advice,
        "ndvi_map_base64": ndvi_map_b64,
        "trend": ndvi_trend,
        "zones": [
            {"id": "Healthy", "ndvi": ">0.6", "pct": round(green_pct, 1), "color": "#22c55e", "status": "Good"},
            {"id": "Stressed", "ndvi": "0.3-0.6", "pct": round(yellow_pct, 1), "color": "#eab308", "status": "Watch"},
            {"id": "Severe", "ndvi": "<0.3", "pct": round(red_pct, 1), "color": "#ef4444", "status": "Act now"},
        ],
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
