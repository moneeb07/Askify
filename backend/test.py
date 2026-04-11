import urllib.request, json, os
from dotenv import load_dotenv

load_dotenv()
key = os.getenv("GEMINI_API_KEY")

url = f"https://generativelanguage.googleapis.com/v1beta/models?key={key}"

with urllib.request.urlopen(url) as r:
    data = json.loads(r.read())

print("\nModels supporting generateContent:")
for m in data.get("models", []):
    if "generateContent" in m.get("supportedGenerationMethods", []):
        print(f"  {m['name']}")

print("\nModels supporting embedContent:")
for m in data.get("models", []):
    if "embedContent" in m.get("supportedGenerationMethods", []):
        print(f"  {m['name']}")