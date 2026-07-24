from typing import Any
from backend.schemas.models import AskRequest, ModeEnum, RecommendationData, BugData, ArchitectureData, GenericData
from backend.core.prompts import PromptBuilder
from backend.core.guardrails import InputGuardrails
from backend.core.cleaner import SchemaCleaner
from backend.core.cache import repo_cache
from backend.core.logger import logger
from backend.core.exceptions import DevForgeError
from backend.llm.gemma_client import GemmaClient
from backend.llm.gemini_client import GeminiClient
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
            import os
            repo_path = os.path.abspath(request.repository_path)
            if os.path.isdir(repo_path):
                logger.info(f"Auto-scanning repository: {repo_path}")
                from core.parser import RepositoryParser
                from schemas.models import RepositorySummary
                parser = RepositoryParser(repo_path)
                raw_result = parser.analyze()
                
                package_managers = set()
                key_dependencies = {}
                for p in raw_result.get("projects", []):
                    if "package_manager" in p:
                        package_managers.add(p["package_manager"])
                    if "dependencies" in p:
                        for k, v in list(p["dependencies"].items())[:50]:
                            key_dependencies[k] = v
                
                summary = RepositorySummary(
                    repository=raw_result.get("repository", "Unknown"),
                    repository_type=raw_result.get("repository_type", "Unknown"),
                    languages=raw_result.get("summary", {}).get("languages", []),
                    frameworks=raw_result.get("summary", {}).get("frameworks", []),
                    databases=raw_result.get("summary", {}).get("databases", []),
                    package_managers=list(package_managers),
                    key_dependencies=key_dependencies
                )
                repo_cache.set(repo_path, summary)
            else:
                raise DevForgeError(code="INVALID_PATH", message="Invalid repository path. Path must be an existing directory.", status_code=400)

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
        logger.info(f"Raw response from LLM: {raw_response}")

        logger.info("Cleaning and validating response...")
        try:
            validated_response = SchemaCleaner.parse_and_validate(raw_response, expected_schema)
        except ValueError as e:
            raise DevForgeError(code="INVALID_JSON", message=str(e), status_code=400)

        return validated_response

ai_service = AIService()