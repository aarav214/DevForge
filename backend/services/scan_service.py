import os
from typing import Any
from backend.schemas.models import ScanRequest, RepositorySummary
from backend.core.parser import RepositoryParser
from backend.core.cache import repo_cache
from backend.core.logger import logger
from backend.core.exceptions import DevForgeError

class ScanService:
    def process(self, request: ScanRequest) -> RepositorySummary:
        workspace_root = os.path.abspath(os.getenv("WORKSPACE_ROOT", os.getcwd()))
        repo_path = os.path.abspath(request.repository_path)
        
        if not os.path.commonpath([workspace_root, repo_path]) == workspace_root:
            raise DevForgeError(code="HTTP_403", message="Access denied. Path is outside the configured workspace root.", status_code=403)
            
        if not os.path.isdir(repo_path):
            raise DevForgeError(code="INVALID_PATH", message="Invalid repository path. Path must be an existing directory.", status_code=400)
            
        logger.info(f"Scanning repository: {repo_path}")
        
        cached_summary = repo_cache.get(repo_path)
        if cached_summary:
            return cached_summary
        
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
        return summary

scan_service = ScanService()
