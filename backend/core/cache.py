import hashlib
import os
import time
from typing import Optional, Dict

from backend.schemas.models import RepositorySummary
from backend.core.logger import logger

class RepositoryCache:
    def __init__(self):
        self._cache: Dict[str, dict] = {}

    def _generate_key(self, repository_path: str) -> str:
        # Check the mtimes of standard manifest files in the root
        manifests = [
            "package.json", "requirements.txt", "pyproject.toml",
            "Cargo.toml", "go.mod", "pom.xml", "pubspec.yaml",
            "package-lock.json", "yarn.lock", "pnpm-lock.yaml"
        ]
        hasher = hashlib.sha256()
        hasher.update(repository_path.encode())
        for manifest in manifests:
            path = os.path.join(repository_path, manifest)
            if os.path.exists(path):
                try:
                    mtime = os.path.getmtime(path)
                    hasher.update(str(mtime).encode())
                except OSError:
                    pass
                    
        return hasher.hexdigest()

    def get(self, repository_path: str) -> Optional[RepositorySummary]:
        key = self._generate_key(repository_path)
        if key in self._cache:
            logger.info(f"Cache hit for {repository_path}")
            return self._cache[key]
        logger.info(f"Cache miss for {repository_path}")
        return None

    def set(self, repository_path: str, summary: RepositorySummary):
        key = self._generate_key(repository_path)
        self._cache[key] = summary
        logger.info(f"Cached summary for {repository_path}")

repo_cache = RepositoryCache()
