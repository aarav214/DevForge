import re
from typing import Tuple
from backend.core.logger import logger

class InputGuardrails:
    ALLOWED_TOPICS = [
        "programming", "frameworks", "dependencies", "debugging",
        "software architecture", "cloud", "docker", "databases", "apis",
        "git", "ci/cd", "devops", "testing", "ai engineering", "llms",
        "code", "react", "python", "javascript", "backend", "frontend"
    ]

    BANNED_TOPICS = [
        "politics", "religion", "finance", "history", "entertainment",
        "medical", "personal advice", "general knowledge", "ignore previous instructions",
        "system prompt"
    ]

    @classmethod
    def validate(cls, query: str) -> Tuple[bool, str]:
        """
        Validates the input query. 
        Returns (is_valid, error_message)
        """
        if not query or len(query.strip()) == 0:
            return False, "Query cannot be empty."
            
        if len(query) > 2000:
            return False, "Query is too long. Maximum allowed length is 2000 characters."

        normalized_query = re.sub(r'\s+', ' ', query).strip().lower()

        for banned in cls.BANNED_TOPICS:
            if re.search(r'\b' + re.escape(banned) + r'\b', normalized_query):
                logger.warning(f"Guardrail triggered for banned topic: {banned}")
                return False, "DevForge only supports software engineering questions."

        # A more advanced check would use a classifier, but for MVP we rely on keyword matching
        # and prompt engineering to stay on topic.

        return True, ""


class OutputGuardrails:
    @classmethod
    def clean_text(cls, response: str) -> str:
        """
        Basic output guardrail that removes markdown fences and greetings before JSON parsing.
        """
        text = response.strip()
        
        # Remove markdown code fences if they surround the entire response
        if text.startswith("```json"):
            text = text[7:]
        elif text.startswith("```"):
            text = text[3:]
            
        if text.endswith("```"):
            text = text[:-3]
            
        return text.strip()