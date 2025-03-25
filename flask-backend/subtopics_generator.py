from flask import request, jsonify
import requests
import os
import json
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
MODEL = "llama-3.3-70b-versatile"

def generate_subtopics(topic):
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {GROQ_API_KEY}"
    }

    prompt = f"""
    Generate a detailed explanation for the topic "{topic}" and include at least 3-5 key subtopics.
    
    Return the response in structured JSON format:
    {{
      "explanation": "<Detailed explanation text>",
      "subtopics": ["Subtopic 1", "Subtopic 2", "Subtopic 3", ...]
    }}
    """

    data = {"model": MODEL, "messages": [{"role": "user", "content": prompt}]}
    response = requests.post(url, json=data, headers=headers)

    if response.status_code == 200:
        raw_content = response.json().get("choices", [{}])[0].get("message", {}).get("content", "{}")

        try:
            # Ensure valid JSON format
            result = json.loads(raw_content.strip("```json\n").strip("```"))
            
            # ✅ Print the explanation and subtopics in terminal
            print("\n📌 Explanation:", result.get("explanation", "No explanation generated"))
            print("📌 Subtopics:", result.get("subtopics", "No subtopics generated"))

            return result
        except json.JSONDecodeError as e:
            return {"error": "Invalid JSON response from API", "details": str(e)}
    else:
        return {"error": f"Error {response.status_code}: {response.text}"}
