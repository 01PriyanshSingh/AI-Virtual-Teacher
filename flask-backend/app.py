from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import requests
import os
from dotenv import load_dotenv
import json
from content_gen import generate_subtopics, process_key_topics  # Import the function
import shutil

load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend connection
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
MODEL = "llama-3.3-70b-versatile"

def generate_syllabus(subject):
    file_path = "subtopics.json"
    if os.path.exists(file_path):
        os.remove(file_path)
    folder_path = "downloaded_images"
    if os.path.exists(folder_path) and os.path.isdir(folder_path):
        shutil.rmtree(folder_path)
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {GROQ_API_KEY}"
    }

    prompt = f"""
    Generate a detailed  syllabus for the subject "{subject}" with:
    - A brief introduction.
    - A list of key topics (at least 5).
    - A short summary in 1-2 lines.
    - A one-liner footer statement.

    Return the response in structured JSON format:
    {{
      "subject": "<Subject Name>",
      "introduction": "<Introduction text>",
      "topics": ["Topic 1", "Topic 2", ...],
      "summary": "<Short summary>",
      "footer": "<Footer line>"
    }}
    """

    data = {"model": MODEL, "messages": [{"role": "user", "content": prompt}]}

    response = requests.post(url, json=data, headers=headers)
    
    if response.status_code == 200:
        raw_content = response.json().get("choices", [{}])[0].get("message", {}).get("content", "{}")

        try:
            # Ensure the response is properly formatted as JSON
            syllabus = json.loads(raw_content.strip("```json\n").strip("```"))
            # Print key topics in the terminal
            print("Key Topics:", syllabus.get("topics", []))
            return syllabus
        except json.JSONDecodeError as e:
            return {"error": "Invalid JSON response from API", "details": str(e)}
    else:
        return {"error": f"Error {response.status_code}: {response.text}"}



@app.route("/generate_syllabus", methods=["POST"])
def generate():
    data = request.json
    subject = data.get("subject", "")
    if not subject:
        return jsonify({"error": "Subject is required"}), 400
    
    syllabus = generate_syllabus(subject)
    
    if "topics" in syllabus:
        key_topics = syllabus["topics"]
        print("Processing key topics:", key_topics)
        
        # Call process_key_topics instead of looping manually
        process_key_topics(key_topics)  

        # Load processed subtopics from the JSON file
        with open("subtopics.json", "r") as file:
            all_subtopics = json.load(file)

        # Attach only relevant subtopics to the response
        subtopics = {topic: all_subtopics.get(topic, []) for topic in key_topics}
        syllabus["subtopics"] = subtopics  

    return jsonify(syllabus)

SUBTOPICS_FILE = "subtopics.json"
IMAGE_FOLDER = "downloaded_images"

@app.route("/get_subtopics")
def get_subtopics():
    """Return subtopics from JSON."""
    if os.path.exists(SUBTOPICS_FILE):
        with open(SUBTOPICS_FILE, "r") as file:
            return jsonify(json.load(file))
    return jsonify({"error": "subtopics.json not found"}), 404

@app.route("/get_image/<title>")
def get_image(title):
    """Fetch the first image for a given subtopic title."""
    title = title.replace("%20", " ")  # Ensure proper folder name
    folder_path = os.path.join(IMAGE_FOLDER, title)
    
    if not os.path.exists(folder_path) or not os.path.isdir(folder_path):
        return jsonify({"error": f"Folder '{title}' not found"}), 404

    # Look for image files dynamically
    for ext in ["jpg", "jpeg", "png", "gif"]:
        image_path = os.path.join(folder_path, f"Image_1.{ext}")
        if os.path.exists(image_path):
            return send_from_directory(folder_path, f"Image_1.{ext}")

    return jsonify({"error": "Image not found"}), 404


if __name__ == "__main__":
    app.run(debug=True)


#helo
