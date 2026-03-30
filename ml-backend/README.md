# Smart Agri AI - ML Backend

This directory contains the machine learning models and API services for the Smart Agri AI platform.

## Directory Structure

```
ml-backend/
├── main.py                      # FastAPI server (crop & disease prediction)
├── train_model.py               # Crop recommendation ML pipeline
├── train_disease_model.py       # Crop disease detection ML pipeline
├── inference.py                 # Standalone disease inference script
├── CropDataset-Enhanced.csv      # Sample crop recommendation dataset
├── requirements.txt             # Python dependencies
├── start.bat / start.sh         # Startup scripts
└── disease_model/               # Trained disease model output directory
    └── crop_disease_model.pkl   # Trained model (generated after training)
```

## Quick Start

### 1. Install Dependencies

```bash
cd ml-backend
pip install -r requirements.txt
```

### 2. Train Crop Disease Model (One-time setup)

```bash
cd ml-backend
python train_disease_model.py
```

This will:
- Extract your local dataset from `C:\Users\harib\Downloads\crop dataset.zip`
- Download PlantVillage dataset as fallback
- Balance and augment the dataset
- Train a MobileNetV3 model with transfer learning
- Export the model to `disease_model/crop_disease_model.pkl`

**Requirements:**
- ~4GB free disk space for datasets
- GPU recommended for training (CUDA-capable GPU will speed up training 10x)
- Training takes ~30-60 minutes on GPU, 2-4 hours on CPU

### 3. Start the API Server

```bash
cd ml-backend
python main.py
```

Or use the startup script:

**Windows:**
```bash
start.bat
```

**Linux/Mac:**
```bash
chmod +x start.sh
./start.sh
```

The API will be available at `http://localhost:8000`

## API Endpoints

### Disease Detection
```
POST /predict/disease
Content-Type: multipart/form-data

Request: Upload an image file
Response:
{
  "success": true,
  "disease": "Tomato Early blight",
  "confidence": 87.5,
  "severity": "Moderate",
  "treatment": "Apply chlorothalonil (2 lb/acre)...",
  "prevention": "Rotate crops every 2-3 years..."
}
```

### Crop Recommendation
```
POST /predict/crop
Content-Type: application/json

Request:
{
  "nitrogen": 78,
  "phosphorus": 42,
  "potassium": 95,
  "ph": 6.8,
  "region": "North"
}

Response:
{
  "success": true,
  "recommendations": [...],
  "soil_analysis": {...},
  "ai_advice": "..."
}
```

## Using the Disease Inference Script

```bash
python inference.py <image_path> <model_path>

# Example:
python inference.py test_leaf.jpg disease_model/crop_disease_model.pkl
```

## Python API Usage

```python
from inference import predict_disease

result = predict_disease(
    image_path="path/to/leaf_image.jpg",
    pickle_file_path="disease_model/crop_disease_model.pkl"
)

print(result)
# {
#   'disease': 'Tomato Early blight',
#   'confidence': 87.5,
#   'severity': 'Moderate',
#   'treatment': 'Apply chlorothalonil...',
#   'prevention': 'Rotate crops...',
#   'success': True
# }
```

## Model Training Configuration

Edit `train_disease_model.py` to customize:

```python
class Config:
    MODEL_BACKBONE = "mobilenetv3"  # Options: "resnet50", "mobilenetv3"
    IMAGE_SIZE = 224
    BATCH_SIZE = 32
    EPOCHS = 50
    LEARNING_RATE = 1e-4
    EARLY_STOPPING_PATIENCE = 7
```

## Supported Disease Classes

The model currently supports:

**Tomato:**
- Bacterial Spot
- Early Blight
- Late Blight
- Leaf Mold
- Septoria Leaf Spot
- Spider Mites
- Target Spot
- Tomato Yellow Leaf Curl Virus
- Tomato Mosaic Virus
- Healthy

**Potato:**
- Early Blight
- Late Blight
- Healthy

**Corn/Maize:**
- Cercospora Leaf Spot
- Common Rust
- Northern Leaf Blight
- Healthy

## Troubleshooting

**CUDA out of memory during training:**
Reduce batch size in Config:
```python
BATCH_SIZE = 16  # instead of 32
```

**Model not found error:**
Ensure you've run `train_disease_model.py` first to generate the model file.

**Slow training on CPU:**
Consider using Google Colab or a GPU-enabled environment for faster training.

## API Documentation

Once the server is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
