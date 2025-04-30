from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import requests
import os
from dotenv import load_dotenv
import json
from content_gen import generate_subtopics, process_key_topics  # Import the function
import shutil

from flask import Flask, request, send_file, abort
import requests
from io import BytesIO
from pydub import AudioSegment
import re


load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend connection
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
MODEL = "llama-3.3-70b-versatile"

from uuid import uuid4

chat_sessions = {} 



def split_text_into_chunks(text, max_chars=200):
    """
    Split text into chunks not exceeding max_chars.
    This simple approach splits on punctuation followed by whitespace.
    """
    sentences = re.split(r'(?<=[.!?])\s+', text)
    chunks = []
    current_chunk = ""
    for sentence in sentences:
        if len(current_chunk) + len(sentence) > max_chars:
            if current_chunk:
                chunks.append(current_chunk.strip())
            current_chunk = sentence
        else:
            current_chunk += " " + sentence
    if current_chunk:
        chunks.append(current_chunk.strip())
    return chunks

@app.route('/tts')
def tts():
    text = request.args.get('text')
    language = request.args.get('language', 'en')
    if not text:
        abort(400, 'Text parameter is required')
    
    # Google Translate TTS endpoint details
    base_url = 'https://translate.google.com/translate_tts'
    params = {
        'ie': 'UTF-8',
        'client': 'tw-ob',
        'tl': language,
    }
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
                      '(KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36',
        'Referer': 'https://translate.google.com/'
    }
    
    # Split text into chunks if it exceeds the maximum allowed characters.
    max_chars = 200  # Adjust this limit as needed
    if len(text) > max_chars:
        chunks = split_text_into_chunks(text, max_chars)
    else:
        chunks = [text]
    
    audio_segments = []
    
    # For each chunk, fetch the TTS audio from Google
    for chunk in chunks:
        params['q'] = chunk
        response = requests.get(base_url, params=params, headers=headers)
        if response.status_code != 200:
            abort(response.status_code, description="Error fetching TTS audio")
        # Load the fetched audio as an AudioSegment (assuming MP3 format)
        segment = AudioSegment.from_file(BytesIO(response.content), format="mp3")
        audio_segments.append(segment)
    
    # Concatenate all audio segments into one
    combined_audio = audio_segments[0]
    for seg in audio_segments[1:]:
        combined_audio += seg  # This appends the next segment
    
    # Export the combined audio to a BytesIO object
    output = BytesIO()
    combined_audio.export(output, format="mp3")
    output.seek(0)
    
    return send_file(output, mimetype="audio/mpeg", as_attachment=False, download_name="tts.mp3")

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
    - A list of key topics (only 3).
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
    for ext in ["jpg", "jpeg", "png", "gif" ,"webp"]:
        image_path = os.path.join(folder_path, f"Image_1.{ext}")
        if os.path.exists(image_path):
            return send_from_directory(folder_path, f"Image_1.{ext}")

    return jsonify({"error": "Image not found"}), 404





 # fallback to new ID

@app.route('/submit_doubt', methods=['POST'])
def submit_doubt():
    data = request.get_json()
    topic = data.get("topic")
    subtopic_name = data.get("subtopic")
    user_doubt = data.get("doubt")
    session_id = data.get("session_id") or str(uuid4()) 
    print(f"\n📦 Using session: {session_id}")
    if session_id not in chat_sessions:
        chat_sessions[session_id] = []

    print(f"\n🔍 Received doubt:\nTopic: {topic}\nSubtopic: {subtopic_name}\nDoubt: {user_doubt}\n")

    # Step 1: Load subtopics.json
    try:
        with open(SUBTOPICS_FILE, "r") as f:
            all_subtopics = json.load(f)
    except Exception as e:
        return jsonify({"error": "Failed to load subtopics", "details": str(e)}), 500

    # Step 2: Find the subtopic object from the topic
    subtopic_list = all_subtopics.get(topic, [])
    selected_subtopic = next((s for s in subtopic_list if s["name"] == subtopic_name), None)

    if not selected_subtopic:
        return jsonify({"error": "Subtopic not found"}), 404

    # Step 3: Extract and compile all explanations under the selected subtopic
    explanations = []
    for subsub in selected_subtopic.get("subsubtopics", []):
        name = subsub.get("name", "")
        explanation = subsub.get("explanation", "")
        explanations.append(f"**{name}**: {explanation}")

    combined_explanation = "\n\n".join(explanations)

    print(f"\n📚 Full Explanation for [{subtopic_name}] under [{topic}]:\n{combined_explanation}\n")

    # Step 4: Add system prompt and user question
    combined_explanation = "\n\n".join([
        f"**{sub.get('name')}**: {sub.get('explanation')}"
        for sub in selected_subtopic.get("subsubtopics", [])
    ])

    system_prompt = {
        "role": "system",
        "content": f"You are a helpful tutor for the topic: {topic} / {subtopic_name}.\n\nHere is the context:\n{combined_explanation}"
    }

    # Add current question to chat history
    chat_sessions[session_id].append({
        "role": "user",
        "content": user_doubt
    })

    # Compile messages for the API call
    messages = [system_prompt] + chat_sessions[session_id]

    # Send to LLM
    payload = {
        "model": MODEL,
        "messages": messages
    }

    print(f"\n🧠 Sending to LLM with {len(messages)} messages.")


    # Step 5: Call Groq API
    try:
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {GROQ_API_KEY}"
        }
        payload = {
            "model": MODEL,
            "messages": [{"role": "user", "content": prompt}]
        }

        response = requests.post(url, headers=headers, json=payload)

        if response.status_code != 200:
            print("❌ Groq API Error:", response.text)
            return jsonify({"error": "Groq API failed", "details": response.text}), 500

        llm_reply = response.json()["choices"][0]["message"]["content"]
        llm_reply = response.json()["choices"][0]["message"]["content"]

        # Save assistant's reply
        chat_sessions[session_id].append({
            "role": "assistant",
            "content": llm_reply
        })

        return jsonify({
            "response": llm_reply,
            "session_id": session_id  # return for frontend to reuse
        })

      
    

    except Exception as e:
        print("⚠️ LLM Error:", str(e))
        return jsonify({"error": "Failed to generate answer from LLM", "details": str(e)}), 500


import random
@app.route("/get_quiz")
def get_quiz():
    """Fetch quiz data from the subtopics.json and return formatted quiz questions."""
    try:
        with open(SUBTOPICS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)

        quiz_questions = []

        for topic, subtopics in data.items():
            for subtopic in subtopics:
                for subsubtopic in subtopic.get("subsubtopics", []):
                    if "quiz" in subsubtopic:
                        quiz_data = subsubtopic["quiz"]
                        question = quiz_data["question"]
                        correct_answer = quiz_data["correct_answer"]
                        wrong_options = quiz_data["wrong_options"]

                        options = [correct_answer] + wrong_options
                        shuffled_options = options.copy()
                        random.shuffle(shuffled_options)

                        quiz_questions.append({
                            "question": question,
                            "correct_answer": correct_answer,
                            "options": shuffled_options,
                            "topic": topic  # Add topic here
                        })

        return jsonify(quiz_questions)

    except Exception as e:
        return jsonify({"error": "Failed to load quiz data", "details": str(e)}), 500



    





if __name__ == "__main__":
    app.run(debug=True)


#helo
