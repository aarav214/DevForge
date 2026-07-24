import os
import time
from google import genai  # type: ignore
from google.genai import types  # type: ignore
from google.genai.errors import APIError  # type: ignore
from backend.core.logger import logger
from backend.core.exceptions import DevForgeError
from backend.llm.base_client import BaseLLM

class GeminiClient(BaseLLM):
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            logger.warning("GEMINI_API_KEY is not set.")
            
        self.model = os.getenv("GEMINI_MODEL", "gemma-4-31b-it")
        self.timeout = int(os.getenv("REQUEST_TIMEOUT", "30"))
        self.max_tokens = int(os.getenv("MAX_TOKENS", "200"))
        # Initialize GenAI client
        self.client = genai.Client(api_key=self.api_key)

    def generate(self, prompt: str) -> str:
        logger.info(f"Calling Gemini API with model: {self.model}")
        retries = 2
        
        # Generation settings closely matching the existing backend
        config = types.GenerateContentConfig(
            temperature=0.2,
            max_output_tokens=self.max_tokens,
            top_p=0.9
        )
        
        for attempt in range(retries):
            try:
                # We do not use timeout explicitly in generate_content unless exposed, 
                # but the user requested preserving timeout handling. 
                # SDK might not have a direct timeout config in GenerateContentConfig.
                # We will just call generate_content.
                response = self.client.models.generate_content(
                    model=self.model,
                    contents=prompt,
                    config=config
                )
                if response.text is not None:
                    return response.text
                elif response.candidates and response.candidates[0].content and response.candidates[0].content.parts:
                    return response.candidates[0].content.parts[0].text
                return ""
            except APIError as e:
                # APIError usually contains status code and message
                status_code = getattr(e, "code", None)
                if status_code in (502, 503, 504) or "timeout" in str(e).lower():
                    if attempt < retries - 1:
                        logger.warning(f"Transient error calling Gemini (attempt {attempt + 1}/{retries}): {str(e)}")
                        time.sleep(2 ** attempt)
                        continue
                
                logger.error(f"Error calling Gemini provider: {str(e)}")
                raise DevForgeError(
                    code="LLM_UNAVAILABLE", 
                    message="The AI model is currently unavailable. Please try again.", 
                    status_code=503
                )
            except Exception as e:
                logger.error(f"Error calling Gemini provider: {str(e)}")
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
