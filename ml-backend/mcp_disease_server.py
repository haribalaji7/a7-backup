#!/usr/bin/env python3
"""
Agri Nova - MCP Disease Detection Server
Uses OpenAI GPT-4o-mini vision API for plant disease classification.
No local model required - all inference via cloud API.
"""

import os
import sys
import json
import base64
from pathlib import Path

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, SCRIPT_DIR)

env_path = Path(SCRIPT_DIR).parent / ".env"
if not env_path.exists():
    env_path = Path.cwd() / ".env"
if env_path.exists():
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, value = line.split("=", 1)
                os.environ.setdefault(key.strip(), value.strip())

try:
    from mcp.server.fastmcp import FastMCP
except ImportError:
    print("Error: mcp package not installed. Run: pip install mcp")
    sys.exit(1)

try:
    import openai
except ImportError:
    print("Error: openai package not installed. Run: pip install openai")
    sys.exit(1)

from inference import DISEASE_KNOWLEDGE, find_best_disease_key, format_disease_name

api_key = os.environ.get("OPENAI_API_KEY", "")
if not api_key:
    print("Warning: OPENAI_API_KEY not set. Disease prediction will fail.")

openai_client = openai.OpenAI(api_key=api_key) if api_key else None

mcp = FastMCP(
    "Agri Nova Disease Detection",
    instructions="Plant disease classification using OpenAI GPT-4o-mini vision API. Send a leaf image and get disease identification with treatment advice."
)

DISEASE_CLASSES = """
Apple___Apple_scab: Dark olive-green spots, velvety texture, leaf curling
Apple___Black_rot: Purple spots with concentric rings, leaf edge curling
Apple___Cedar_apple_rust: Orange-yellow spots, tube-like structures on underside
Apple___healthy: Green healthy leaves, no spots or discoloration
Blueberry___healthy: Green healthy blueberry leaves, no symptoms
Cherry_(including_sour)___Powdery_mildew: White powdery coating, distorted growth
Cherry_(including_sour)___healthy: Green healthy cherry leaves
Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot: Tan rectangular lesions between veins
Corn_(maize)___Common_rust_: Reddish-brown pustules on both leaf surfaces
Corn_(maize)___Northern_Leaf_Blight: Long cigar-shaped gray-green lesions
Corn_(maize)___healthy: Green healthy corn leaves
Grape___Black_rot: Brown circular spots with dark borders, black fruiting bodies
Grape___Esca_(Black_Measles): Reddish-brown spots between veins, yellowing
Grape___Leaf_blight_(Isariopsis_Leaf_Spot): Circular brown spots with yellow halos
Grape___healthy: Green healthy grape leaves
Orange___Haunglongbing_(Citrus_greening): Yellowing, blotchy mottling, asymmetrical patterns
Peach___Bacterial_spot: Small water-soaked spots turning brown, holes in leaves
Peach___healthy: Green healthy peach leaves
Pepper,_bell___Bacterial_spot: Small water-soaked spots, brown lesions with yellow halos
Pepper,_bell___healthy: Green healthy pepper leaves
Potato___Early_blight: Concentric ring spots (target pattern), brown lesions
Potato___Late_blight: Large dark brown lesions, white fungal growth in humidity
Potato___healthy: Green healthy potato leaves
Raspberry___healthy: Green healthy raspberry leaves
Soybean___healthy: Green healthy soybean leaves
Squash___Powdery_mildew: White powdery patches on leaf surfaces
Strawberry___Leaf_scorch: Purple spots expanding to brown scorched appearance
Strawberry___healthy: Green healthy strawberry leaves
Tomato___Bacterial_spot: Small dark spots with yellow halos, spots may merge
Tomato___Early_blight: Concentric ring spots (bullseye pattern), brown lesions
Tomato___Late_blight: Large dark water-soaked lesions, white mold in humidity
Tomato___Leaf_Mold: Pale green spots upper surface, olive-green mold underneath
Tomato___Septoria_leaf_spot: Small circular spots with dark borders and gray centers
Tomato___Spider_mites Two-spotted_spider_mite: Tiny yellow dots, stippling, fine webbing
Tomato___Target_Spot: Concentric ring spots, larger than early blight
Tomato___Tomato_Yellow_Leaf_Curl_Virus: Upward curling leaves, yellowing, stunted growth
Tomato___Tomato_mosaic_virus: Mottled light/dark green patterns, leaf distortion
Tomato___healthy: Green healthy tomato leaves, no disease symptoms
"""

DISEASE_LIST = [c.split(":")[0].strip() for c in DISEASE_CLASSES.strip().split("\n")]

PROMPT_TEMPLATE = """You are an expert plant pathologist. Analyze this leaf image and identify the disease.

Available disease classes:
{classes}

Respond with ONLY a valid JSON object (no markdown, no extra text):
{{
    "disease_class": "exact class name from the list above",
    "confidence": 0 to 100,
    "severity": "Mild" or "Moderate" or "Severe" or "Critical",
    "reasoning": "brief explanation of visual features observed"
}}

If the image is not a plant leaf, set disease_class to "unknown" and confidence to 0."""


def encode_image(image_path: str) -> str:
    with open(image_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


def parse_json_response(text: str) -> dict:
    if "```" in text:
        parts = text.split("```")
        for part in parts:
            cleaned = part.strip()
            if cleaned.startswith("json"):
                cleaned = cleaned[4:].strip()
            if cleaned.startswith("{"):
                try:
                    return json.loads(cleaned)
                except json.JSONDecodeError:
                    continue
    try:
        return json.loads(text.strip())
    except json.JSONDecodeError:
        return {"error": f"Failed to parse JSON response: {text[:300]}"}


def predict_with_openai(image_base64: str) -> dict:
    if openai_client is None:
        return {"error": "OPENAI_API_KEY not set in environment"}

    prompt = PROMPT_TEMPLATE.format(classes=DISEASE_CLASSES)

    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_base64}",
                                "detail": "high",
                            },
                        },
                    ],
                },
            ],
            response_format={"type": "json_object"},
            max_tokens=500,
            temperature=0.1,
        )

        result = parse_json_response(response.choices[0].message.content)
        return result
    except openai.AuthenticationError:
        return {"error": "Invalid OPENAI_API_KEY"}
    except openai.RateLimitError:
        return {"error": "OpenAI API rate limit exceeded. Try again later."}
    except Exception as e:
        return {"error": f"OpenAI API error: {str(e)}"}


def build_prediction_response(result: dict) -> str:
    if "error" in result:
        return json.dumps({"success": False, "error": result["error"]}, indent=2)

    disease_class = result.get("disease_class", "unknown")
    confidence = result.get("confidence", 0)
    severity = result.get("severity", "Unknown")
    reasoning = result.get("reasoning", "")

    disease_key = find_best_disease_key(disease_class)
    disease_info = DISEASE_KNOWLEDGE.get(disease_key, DISEASE_KNOWLEDGE["unknown"])

    return json.dumps(
        {
            "success": True,
            "disease": format_disease_name(disease_class),
            "raw_class": disease_class,
            "confidence": confidence,
            "severity": severity,
            "treatment": disease_info["treatment"],
            "prevention": disease_info["prevention"],
            "reasoning": reasoning,
        },
        indent=2,
    )


@mcp.tool()
def predict_disease(image_path: str) -> str:
    """Analyze a plant leaf image file and identify the disease. Returns disease name, confidence, severity, treatment, and prevention advice. Input: path to an image file (JPG/PNG)."""
    if not os.path.exists(image_path):
        return json.dumps({"success": False, "error": f"Image not found: {image_path}"}, indent=2)

    try:
        image_base64 = encode_image(image_path)
    except Exception as e:
        return json.dumps({"success": False, "error": f"Failed to read image: {str(e)}"}, indent=2)

    result = predict_with_openai(image_base64)
    return build_prediction_response(result)


@mcp.tool()
def predict_disease_base64(image_base64: str) -> str:
    """Analyze a plant leaf image from base64-encoded data and identify the disease. Returns disease name, confidence, severity, treatment, and prevention advice. Input: base64 string of the image (no data URI prefix needed)."""
    result = predict_with_openai(image_base64)
    return build_prediction_response(result)


@mcp.tool()
def get_disease_info(disease_name: str) -> str:
    """Get treatment and prevention information for a specific plant disease. Input: disease name (e.g., 'Tomato Early Blight', 'Tomato___Early_blight')."""
    disease_key = find_best_disease_key(disease_name)
    disease_info = DISEASE_KNOWLEDGE.get(disease_key, DISEASE_KNOWLEDGE["unknown"])

    return json.dumps(
        {
            "disease": format_disease_name(disease_key),
            "treatment": disease_info["treatment"],
            "prevention": disease_info["prevention"],
            "severity_threshold": disease_info.get("severity_threshold", 70),
        },
        indent=2,
    )


@mcp.tool()
def list_supported_diseases() -> str:
    """List all 38 supported plant disease classes that can be detected by this system."""
    return json.dumps({"total_classes": len(DISEASE_LIST), "diseases": DISEASE_LIST}, indent=2)


if __name__ == "__main__":
    mcp.run()
