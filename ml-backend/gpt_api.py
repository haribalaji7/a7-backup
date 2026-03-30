from flask import Flask, request, jsonify
from flask_cors import CORS
from g4f.client import Client
import os

app = Flask(__name__)
CORS(app)

client = Client()

SYSTEM_PROMPT = """You are an expert Indian Agricultural AI Assistant called "Smart Agri AI". 

Your expertise includes:
- Crop management (wheat, rice, cotton, pulses, vegetables, fruits)
- Soil health and nutrient management
- Pest and disease identification and control
- Irrigation scheduling and water management
- Fertilizer recommendations (organic and chemical)
- Weather-based farming advice
- Kharif and Rabi season planning
- Modern farming techniques

Guidelines:
- Be helpful, friendly, and concise
- Answer in the same language the user is using
- Provide practical, actionable advice suitable for Indian farming conditions
- Mention specific products, dosages, and timing when relevant
- If you don't know something, say so honestly

Current farm conditions (when relevant):
- Temperature: 32°C
- Humidity: 67%
- Soil moisture: 38%
- UV Index: 8 (High)

User is speaking in their selected language. Respond appropriately."""

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        messages = data.get('messages', [])
        language = data.get('language', 'en')

        conversation = [{"role": "system", "content": SYSTEM_PROMPT}]
        for m in messages:
            conversation.append({"role": m.get("role", "user"), "content": m.get("content", "")})

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=conversation,
            web_search=False
        )

        return jsonify({
            "message": response.choices[0].message.content,
            "success": True
        })

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({
            "error": str(e),
            "success": False
        }), 500

if __name__ == '__main__':
    print("Starting GPT-4 Free API server on http://localhost:8000/chat")
    app.run(port=8000, debug=True)
