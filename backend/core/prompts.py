from backend.schemas.models import RepositorySummary

SYSTEM_PROMPT = """You are DevForge.
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
- Be concise. Avoid greetings, conversational texts , description in 1 line , and conclusions.
"""

class PromptBuilder:
    def __init__(self, summary: RepositorySummary):
        self.summary = summary
        self.context_json = summary.model_dump_json(indent=2, exclude_none=True, exclude_unset=True)

    def recommend(self, query: str) -> str:
        return f"""{SYSTEM_PROMPT}

Repository Context:
{self.context_json}

Goal:
{query}

Task:
Recommend production-ready libraries to achieve the goal, considering the current stack. Explain why they fit and mention alternatives.

Expected Output Schema (JSON):
{{
  "recommendations": [
    {{"library": "Name", "purpose": "Why it's used", "reason": "Why it fits this stack", "compatibility": "Good/Warning", "alternatives": []}}
  ],
  "summary": "Brief explanation"
}}
"""

    def bug(self, query: str) -> str:
        return f"""{SYSTEM_PROMPT}

Repository Context:
{self.context_json}

Reported Issue / Code snippet:
{query}

Task:
Identify bugs or issues in the provided snippet or description.

Expected Output Schema (JSON):
{{
  "bugs": [
    {{"issue": "Description", "severity": "High/Low", "fix": "Suggested fix"}}
  ],
  "summary": "Overall assessment"
}}
"""

    def architecture(self, query: str) -> str:
        return f"""{SYSTEM_PROMPT}

Repository Context:
{self.context_json}

Goal:
{query}

Task:
Review the architecture of the project based on the context. Provide an overall score and specific recommendations.

Expected Output Schema (JSON):
{{
  "overall_score": 8,
  "scores": {{"maintainability": 8, "security": 9}},
  "strengths": ["Good use of frameworks"],
  "weaknesses": ["Missing test framework"],
  "recommendations": ["Add Jest for testing"]
}}
"""