@echo off

cd /d "%~dp0"

echo Installing ML backend dependencies...
pip install -r requirements.txt -q

echo Training ML model...
python train_model.py

echo Starting FastAPI server on http://localhost:8000
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
