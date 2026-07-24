import os
from fastapi import APIRouter
from schemas.models import ScanRequest, APIResponse, RepositorySummary, AskRequest
from core.parser import RepositoryParser
from core.cache import repo_cache
from core.logger import logger
from core.exceptions import DevForgeError
from services.ai_service import ai_service

router = APIRouter()

@router.post("/scan", response_model=APIResponse)
def scan_repository(request: ScanRequest):
    workspace_root = os.path.abspath(os.getenv("WORKSPACE_ROOT", os.getcwd()))
    repo_path = os.path.abspath(request.repository_path)
    
    if not os.path.commonpath([workspace_root, repo_path]) == workspace_root:
        raise DevForgeError(code="HTTP_403", message="Access denied. Path is outside the configured workspace root.", status_code=403)
        
    if not os.path.isdir(repo_path):
        raise DevForgeError(code="INVALID_PATH", message="Invalid repository path. Path must be an existing directory.", status_code=400)
        
    logger.info(f"Scanning repository: {repo_path}")
    
    cached_summary = repo_cache.get(repo_path)
    if cached_summary:
        return APIResponse(success=True, mode="scan", data=cached_summary.model_dump())
    
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
    
    return APIResponse(success=True, mode="scan", data=summary.model_dump())

@router.post("/ask", response_model=APIResponse)
def ask_ai(request: AskRequest):
    logger.info(f"Processing /ask for mode {request.mode}")
    result_data = ai_service.process(request)
    return APIResponse(success=True, mode=request.mode, data=result_data.model_dump())
