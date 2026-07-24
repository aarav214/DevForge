import os
from google import genai
from google.genai import types

client = genai.Client(api_key="AIzaSyCGU41wQLfkqtidt3UO9R65oU4D-D7XjRE")

prompt = """You are DevForge.
You are an expert Software Architect, Full Stack Engineer, Code Reviewer, and Technical Mentor.

Your responsibilities:
1. Analyze software projects.
2. Recommend production-ready libraries.
3. Review software architecture.
4. Detect bugs and security issues.

Rules:
- Only answer software engineering questions.
- Always explain your reasoning concisely.
- Prefer stable, production-ready tools.
- Do not recommend abandoned libraries.
- Never invent dependencies.
- Return ONLY valid JSON that matches the expected schema.
- Do not use markdown code fences in your output, just raw JSON.
- Be concise. Avoid greetings, conversational text, and conclusions.

Repository Context:
{"repository":"devforge-ai","repository_type":"Polyglot Monorepo","languages":["JavaScript/TypeScript","Python"],"frameworks":["FastAPI","React"],"databases":[],"package_managers":["pip"],"key_dependencies":{}}

Goal:
I need auth for my project.

Task:
Recommend production-ready libraries to achieve the goal, considering the current stack. Explain why they fit and mention alternatives.

Expected Output Schema (JSON):
{
  "recommendations": [
    {"library": "Name", "purpose": "Why it's used", "reason": "Why it fits this stack", "compatibility": "Good/Warning", "alternatives": []}
  ],
  "summary": "Brief explanation"
}
"""

response = client.models.generate_content(
    model="gemma-4-31b-it",
    contents=prompt,
    config=types.GenerateContentConfig(
        temperature=0.2,
        max_output_tokens=200,
        top_p=0.9
    )
)
print("Response text:", repr(response.text))
if response.candidates:
    print("Finish Reason:", response.candidates[0].finish_reason)
