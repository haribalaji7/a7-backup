# Crop Disease Detection: Model Retraining & Accuracy Improvement Plan

Based on the current architecture in `ml-backend/main.py` and best practices from top repositories in the [crop-disease-detection GitHub topic](https://github.com/topics/crop-disease-detection), here is a structured plan to significantly improve the scanning accuracy of your application.

## 1. Dataset Enhancement (The Most Critical Step)
Currently, model accuracy suffers when trained strictly on "lab-condition" datasets (like pure PlantVillage) because real-world scans have noisy backgrounds, hands, shadows, and varying lighting.
*   **Actionable Step:** Combine the **PlantVillage Dataset** (54,000+ controlled images) with the **PlantDoc Dataset** (2,500+ real-world noisy field images). 
*   **Why:** Trending repositories show that including real background contexts prevents the model from overfitting to the blank backgrounds of lab datasets, drastically improving the accuracy of user phone scans.

## 2. Advanced Data Augmentation
The current `train_disease_model.py` uses basic `torchvision` transforms.
*   **Actionable Step:** Integrate the **Albumentations** library into the training pipeline.
*   **Techniques to Add:**
    *   **MixUp / CutMix:** Helps the model learn robust features rather than memorizing exact leaf shapes.
    *   **RandomShadow & RandomSunFlare:** Simulates outdoor farming lighting conditions safely.
    *   **MotionBlur & GaussianNoise:** Simulates unsteady hand movements when users take photos in the field.

## 3. Model Architecture Upgrade
Both `main.py` (TensorFlow) and `train_disease_model.py` (PyTorch) depend on older architectures like MobileNetV2/V3.
*   **Actionable Step:** Upgrade the base model to **EfficientNetB3** or **ConvNeXt**. 
*   **Why:** EfficientNet provides a significantly higher accuracy-to-parameter ratio. It is the gold standard in modern Kaggle competitions and top GitHub repos for leaf disease classification (reaching 98-99% accuracy on plant datasets) without slowing down the API response time.

## 4. Unifying the Training & Inference Pipeline
There is currently a mismatch in your codebase:
*   `main.py` expects a **TensorFlow/Keras** model (`.keras`).
*   `train_disease_model.py` trains and exports a **PyTorch** model (`.pkl`).
*   **Actionable Step:**
    *   Rewrite the training script to fully embrace TensorFlow/Keras (since it's already implemented in your FastAPI server) OR rewrite the FastAPI inference to use PyTorch. 
    *   **Recommendation:** Stick to TensorFlow for the backend. We will write a brand new `train_efficientnet_tf.py` script that downloads the PlantVillage dataset, applies advanced augmentations, trains an `EfficientNetB3` model, and exports a `trained_plant_disease_model.keras` file that works out-of-the-box with `main.py`.

## 5. (Optional but heavily trending) Moving from Classification to Object Detection
If you want the app to place a **bounding box** exactly over the diseased part of the leaf:
*   **Actionable Step:** Migrate from pure Classification to **YOLOv8** or **YOLOv11** (by Ultralytics).
*   **Why:** This is the #1 trending approach in GitHub's crop-disease-detection topic because it visually proves to the user exactly where the disease is located, drastically increasing user trust.
     