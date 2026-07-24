import os
import requests
import time
from core.logger import logger
from core.exceptions import DevForgeError
from llm.base_client import BaseLLM

class GemmaClient(BaseLLM):
    def __init__(self):
        self.endpoint = os.getenv("GEMMA_ENDPOINT", "")
        self.provider = os.getenv("LLM_PROVIDER", "mock")
        self.timeout = int(os.getenv("REQUEST_TIMEOUT", "30"))
        self.max_tokens = int(os.getenv("MAX_TOKENS", "200"))
        self.session = requests.Session()
        
    def generate(self, prompt: str) -> str:
        if self.provider == "mock" or not self.endpoint:
            logger.info("Using MOCK inference for GemmaClient.")
            # For hackathon development, return a mock response that matches schemas
            if '"mode": "recommend"' in prompt:
                return '{"recommendations": [{"library": "FastAPI", "purpose": "Web API", "reason": "Fits Python", "compatibility": "High", "alternatives": []}], "summary": "Use FastAPI"}'
            elif '"mode": "bug"' in prompt:
                return '{"bugs": [{"issue": "Missing error handling", "severity": "Medium", "fix": "Add try-except"}], "summary": "Needs error handling"}'
            elif '"mode": "architecture"' in prompt:
                return '{"overall_score": 8, "scores": {"maintainability": 8, "security": 8}, "strengths": ["Good modularity"], "weaknesses": ["No caching"], "recommendations": ["Add Redis"]}'
            
            # generic fallback
            return '{"data": "Mock response"}'

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
        
        # Fallback if loop ends (should theoretically be caught above, but just in case)
        raise DevForgeError(
            code="LLM_UNAVAILABLE", 
            message="The AI model is currently unavailable after retries.", 
            status_code=503
        )