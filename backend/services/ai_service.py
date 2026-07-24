from typing import Any
from schemas.models import AskRequest, ModeEnum, RecommendationData, BugData, ArchitectureData, GenericData
from core.prompts import PromptBuilder
from core.guardrails import InputGuardrails
from core.cleaner import SchemaCleaner
from core.cache import repo_cache
from core.logger import logger
from core.exceptions import DevForgeError
from llm.gemma_client import GemmaClient
from llm.gemini_client import GeminiClient
import os

class AIService:
    def __init__(self):
        provider = os.getenv("LLM_PROVIDER", "kaggle")
        if provider == "gemini":
            self.llm = GeminiClient()
        else:
            self.llm = GemmaClient()

    def process(self, request: AskRequest) -> Any:
        summary = repo_cache.get(request.repository_path)
        if not summary:
            raise DevForgeError(code="NOT_SCANNED", message="Repository summary not found in cache. Please /scan first.", status_code=400)

        is_valid, error_msg = InputGuardrails.validate(request.query)
        if not is_valid:
            logger.warning(f"Input rejected by guardrails: {error_msg}")
            raise DevForgeError(code="REJECTED_QUERY", message=error_msg, status_code=400)

        prompt_builder = PromptBuilder(summary)
        
        if request.mode == ModeEnum.recommend:
            prompt = prompt_builder.recommend(request.query)
            expected_schema = RecommendationData
        elif request.mode == ModeEnum.bug:
            prompt = prompt_builder.bug(request.query)
            expected_schema = BugData
        elif request.mode == ModeEnum.architecture:
            prompt = prompt_builder.architecture(request.query)
            expected_schema = ArchitectureData
        else:
            logger.info(f"Mode {request.mode} not fully implemented, using generic.")
            prompt = f"System: Only answer software engineering questions. User: {request.query}"
            expected_schema = GenericData

        logger.info(f"Generating LLM response for mode: {request.mode}")
        raw_response = self.llm.generate(prompt)

        logger.info("Cleaning and validating response...")
        try:
            validated_response = SchemaCleaner.parse_and_validate(raw_response, expected_schema)
        except ValueError as e:
            raise DevForgeError(code="INVALID_JSON", message=str(e), status_code=400)

        return validated_response

ai_service = AIService()