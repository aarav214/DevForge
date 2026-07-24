from google import genai
from google.genai import types

client = genai.Client(api_key="AIzaSyCGU41wQLfkqtidt3UO9R65oU4D-D7XjRE")

response = client.models.generate_content(
    model="gemma-4-31b-it",
    contents="Return {'hello': 'world'} in JSON",
    config=types.GenerateContentConfig(response_mime_type="application/json")
)
print("Response text:", response.text)
