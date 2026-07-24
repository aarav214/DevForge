from google import genai
from google.genai import types

client = genai.Client(api_key="AIzaSyCGU41wQLfkqtidt3UO9R65oU4D-D7XjRE")

response = client.models.generate_content(
    model="gemma-4-31b-it",
    contents="Tell me a very long story about a dog, at least 500 words.",
    config=types.GenerateContentConfig(max_output_tokens=10)
)
print("text property:", repr(response.text))
if response.candidates and response.candidates[0].content and response.candidates[0].content.parts:
    print("part text:", repr(response.candidates[0].content.parts[0].text))
