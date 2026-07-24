import os
import requests
import time
from backend.core.logger import logger
from backend.core.exceptions import DevForgeError
from backend.llm.base_client import BaseLLM

class GemmaClient(BaseLLM):
    def __init__(self):
        self.endpoint = os.getenv("GEMMA_ENDPOINT", "")
        self.provider = os.getenv("LLM_PROVIDER", "mock").strip().lower()
        self.timeout = int(os.getenv("REQUEST_TIMEOUT", "90"))
        self.max_tokens = int(os.getenv("MAX_TOKENS", "2000"))
        self.session = requests.Session()

    def _mock_response(self, prompt: str) -> str:
        prompt_lower = prompt.lower()
        if '"recommendations": [' in prompt or 'recommendations' in prompt:
            if '3d' in prompt_lower or 'three' in prompt_lower:
                return '{"recommendations": [{"library": "React Three Fiber", "purpose": "React-friendly WebGL renderer", "reason": "Fits React 19 in this stack", "compatibility": "High", "alternatives": ["Babylon.js", "Three.js"]}], "summary": "Use React Three Fiber for declarative 3D scenes in React."}'
            elif 'gradient' in prompt_lower or 'ui' in prompt_lower:
                return '{"recommendations": [{"library": "Framer Motion", "purpose": "Animation and UI components transition library", "reason": "Excellent for rendering interactive animations and custom gradients", "compatibility": "High", "alternatives": ["GSAP"]}, {"library": "Shadcn UI", "purpose": "Reusable component collection", "reason": "Highly customizable styles and clean design presets", "compatibility": "High", "alternatives": ["Chakra UI"]}], "summary": "For beautiful UI gradients and component interactions, combine Framer Motion and custom CSS."}'
            elif 'auth' in prompt_lower or 'login' in prompt_lower:
                return '{"recommendations": [{"library": "Better Auth", "purpose": "Authentication library", "reason": "TypeScript-first and very secure", "compatibility": "High", "alternatives": ["Auth.js"]}], "summary": "Better Auth fits TypeScript project structures well."}'
            else:
                return '{"recommendations": [{"library": "FastAPI", "purpose": "Web API", "reason": "Fits Python", "compatibility": "High", "alternatives": []}], "summary": "Use FastAPI"}'
        elif '"bugs": [' in prompt or 'bugs' in prompt:
            return '{"bugs": [{"issue": "Missing error handling", "severity": "Medium", "fix": "Add try-except"}], "summary": "Needs error handling"}'
        elif '"overall_score":' in prompt or 'overall_score' in prompt:
            return '{"overall_score": 8, "scores": {"maintainability": 8, "security": 8}, "strengths": ["Good modularity"], "weaknesses": ["No caching"], "recommendations": ["Add Redis"]}'
        return '{"data": "Mock response"}'

    def _google_ai_studio_response(self, prompt: str) -> str:
        api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY") or ""
        if not api_key:
            raise DevForgeError(
                code="LLM_CONFIG_ERROR",
                message="Missing GOOGLE_API_KEY or GEMINI_API_KEY for Google AI Studio.",
                status_code=500,
            )

        endpoint = self.endpoint.strip()
        if not endpoint:
            endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemma-4-31b-it:generateContent"

        if "key=" not in endpoint:
            separator = "&" if "?" in endpoint else "?"
            endpoint = f"{endpoint}{separator}key={api_key}"

        logger.info("Calling Google AI Studio endpoint")
        response = self.session.post(
            endpoint,
            json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": 0.2, "maxOutputTokens": self.max_tokens},
            },
            timeout=self.timeout,
        )
        response.raise_for_status()
        result = response.json()
        logger.info(f"Google AI Studio raw response: {result}")
        candidates = result.get("candidates", [])
        if candidates:
            parts = candidates[0].get("content", {}).get("parts", [])
            if parts:
                return "".join(part.get("text", "") for part in parts if isinstance(part, dict) and not part.get("thought"))
        return result.get("text", "") or result.get("response", "")

    def generate(self, prompt: str) -> str:
        if self.provider == "mock" or not self.endpoint and self.provider != "google_ai_studio":
            logger.info("Using MOCK inference for GemmaClient.")
            return self._mock_response(prompt)

        if self.provider in {"google_ai_studio", "google"}:
            try:
                return self._google_ai_studio_response(prompt)
            except requests.exceptions.RequestException as e:
                logger.error(f"Error calling Google AI Studio: {str(e)}")
                raise DevForgeError(
                    code="LLM_UNAVAILABLE",
                    message="The AI model is currently unavailable. Please try again.",
                    status_code=503,
                )

        logger.info(f"Calling real LLM endpoint: {self.endpoint}")
        retries = 2
        for attempt in range(retries):
            try:
                response = self.session.post(
                    self.endpoint,
                    json={"prompt": prompt, "max_tokens": self.max_tokens},
                    timeout=self.timeout
                )
                response.raise_for_status()
                result = response.json()
                return result.get("generated_text", "") or result.get("response", "")
            except requests.exceptions.RequestException as e:
                status_code = getattr(e.response, "status_code", None) if hasattr(e, 'response') else None
                if status_code in (502, 503, 504) or isinstance(e, (requests.exceptions.ConnectionError, requests.exceptions.Timeout)):
                    if attempt < retries - 1:
                        logger.warning(f"Transient error calling LLM (attempt {attempt + 1}/{retries}): {str(e)}")
                        time.sleep(2 ** attempt)
                        continue
                logger.error(f"Error calling LLM provider: {str(e)}")
                raise DevForgeError(
                    code="LLM_UNAVAILABLE",
                    message="The AI model is currently unavailable. Please try again.",
                    status_code=503
                )

        raise DevForgeError(
            code="LLM_UNAVAILABLE",
            message="The AI model is currently unavailable after retries.",
            status_code=503
        )