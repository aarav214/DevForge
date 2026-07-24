import sys
import os
sys.path.append(os.getcwd())

from services.ai_service import ai_service
from schemas.models import AskRequest, ModeEnum, RepositorySummary
from core.cache import repo_cache
from core.parser import RepositoryParser

# Mock scanning first to populate cache
parser = RepositoryParser("/home/suzi/WORKSPACE/Projects/devforge-ai")
raw_result = parser.analyze()

summary = RepositorySummary(
    repository=raw_result.get("repository", "Unknown"),
    repository_type=raw_result.get("repository_type", "Unknown"),
    languages=raw_result.get("summary", {}).get("languages", []),
    frameworks=raw_result.get("summary", {}).get("frameworks", []),
    databases=raw_result.get("summary", {}).get("databases", []),
    package_managers=["pip"],
    key_dependencies={}
)

repo_cache.set("/home/suzi/WORKSPACE/Projects/devforge-ai", summary)

req = AskRequest(
    mode=ModeEnum.recommend, 
    query="I need auth for my project.", 
    repository_path="/home/suzi/WORKSPACE/Projects/devforge-ai"
)

try:
    print("SENDING REQUEST")
    # I'll hook directly into llm to print raw response
    prompt_builder = ai_service.__class__.process.__globals__["PromptBuilder"](summary)
    prompt = prompt_builder.recommend(req.query)
    raw = ai_service.llm.generate(prompt)
    print("RAW RESPONSE:", repr(raw))
except Exception as e:
    import traceback
    traceback.print_exc()
