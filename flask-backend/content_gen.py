import os
import requests
import json
from dotenv import load_dotenv
from img_fetch import download_images  # Import the function

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
MODEL = "llama-3.3-70b-versatile"

def generate_subtopics(key_topic):

    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {GROQ_API_KEY}"
    }

    prompt = f"""
    For the key topic "{key_topic}", generate a list of subtopics, each containing subsubtopics.
    Each subsubtopic should have a title for fetching an image and an explanation.

    Return the response in structured JSON format:
    {{
        "{key_topic}": [
            {{
                "name": "<Subtopic 1>",
                "subsubtopics": [
                    {{
                        "name": "<Subsubtopic 1>",
                        "title": "<Title for Image Search>",
                        "explanation": "<Explanation for Subsubtopic 1>"
                    }},
                    {{
                        "name": "<Subsubtopic 2>",
                        "title": "<Title for Image Search>",
                        "explanation": "<Explanation for Subsubtopic 2>"
                    }}
                ]
            }}
        ]
    }}
    """

    data = {"model": MODEL, "messages": [{"role": "user", "content": prompt}]}
    response = requests.post(url, json=data, headers=headers)
    
    if response.status_code == 200:
        raw_content = response.json().get("choices", [{}])[0].get("message", {}).get("content", "{}")
        try:
            subtopics = json.loads(raw_content.strip("```json\n").strip("```"))
            return subtopics
        except json.JSONDecodeError as e:
            return {"error": "Invalid JSON response from API", "details": str(e)}
    else:
        return {"error": f"Error {response.status_code}: {response.text}"}

def process_key_topics(key_topics, output_file="subtopics.json"):
    if not os.path.exists(output_file):
        with open(output_file, "w") as file:
            json.dump({}, file)

    with open(output_file, "r") as file:
        all_subtopics = json.load(file)
       

    for topic in key_topics:
        if topic not in all_subtopics:
        
            result = generate_subtopics(topic)
            all_subtopics[topic] = result.get(topic, []) if topic in result else result

    with open(output_file, "w") as file:
        json.dump(all_subtopics, file, indent=4)


    titles = []
    
    for subtopic_list in all_subtopics.values():
    
        for subtopic in subtopic_list:
        
            for subsubtopic in subtopic.get("subsubtopics", []):
            
                if "title" in subsubtopic:
                    
                    titles.append(subsubtopic["title"])
                  
    print("helloooo")
    print(titles)
    for title in titles:
        
        download_images(title, 1)
