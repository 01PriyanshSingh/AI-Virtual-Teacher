import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
MODEL = "llama-3.3-70b-versatile"

def generate_subtopics(key_topic):
    print("Got topic")
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {GROQ_API_KEY}"
    }

    prompt = f"""
    For the key topic "{key_topic}", generate a list of subtopics with explanations. 
    Return the response in structured JSON format:
    {{
      "key_topic": "{key_topic}",
      "subtopics": [
        {{"name": "<Subtopic 1>", "explanation": "<Explanation for Subtopic 1>"}},
        {{"name": "<Subtopic 2>", "explanation": "<Explanation for Subtopic 2>"}},
        ...
      ]
    }}
    """

    data = {"model": MODEL, "messages": [{"role": "user", "content": prompt}]}

    response = requests.post(url, json=data, headers=headers)
    
    if response.status_code == 200:
        raw_content = response.json().get("choices", [{}])[0].get("message", {}).get("content", "{}")
        try:
            # Parse the response as JSON
            subtopics = json.loads(raw_content.strip("```json\n").strip("```"))
            return subtopics
        except json.JSONDecodeError as e:
            return {"error": "Invalid JSON response from API", "details": str(e)}
    else:
        return {"error": f"Error {response.status_code}: {response.text}"}

def process_key_topics(key_topics, output_file="subtopics.json"):
    # Check if the JSON file exists; if not, create an empty one
    if not os.path.exists(output_file):
        with open(output_file, "w") as file:
            json.dump({}, file)

    # Load existing data from the JSON file
    with open(output_file, "r") as file:
        all_subtopics = json.load(file)
        print("done")

    for topic in key_topics:
        if topic not in all_subtopics:  # Avoid reprocessing existing topics
            print(f"Processing key topic: {topic}")
            result = generate_subtopics(topic)
            all_subtopics[topic] = result.get("subtopics", []) if "subtopics" in result else result

    # Save the updated results to the JSON file
    with open(output_file, "w") as file:
        json.dump(all_subtopics, file, indent=4)
    print(f"Subtopics saved to {output_file}")
