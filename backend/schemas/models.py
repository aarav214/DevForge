from enum import Enum
from typing import List, Dict, Any, Optional
from pydantic import BaseModel


class ModeEnum(str, Enum):
    recommend = "recommend"
    review = "review"
    bug = "bug"
    architecture = "architecture"
    compare = "compare"
    security = "security"
    summary = "summary"
    chat = "chat"


class RepositorySummary(BaseModel):
    repository: str
    repository_type: str
    languages: List[str]
    frameworks: List[str]
    databases: List[str]
    package_managers: List[str]
    testing_frameworks: List[str] = []
    deployment_platforms: List[str] = []
    key_dependencies: Dict[str, str] = {}


class ScanRequest(BaseModel):
    repository_path: str


class AskRequest(BaseModel):
    mode: ModeEnum
    query: str
    repository_path: str


class ErrorDetail(BaseModel):
    code: str
    message: str


class APIResponse(BaseModel):
    success: bool
    mode: Optional[str] = None
    data: Optional[Any] = None
    error: Optional[ErrorDetail] = None


# Specific data schemas expected from LLM
class RecommendationItem(BaseModel):
    library: str
    purpose: str
    reason: str
    compatibility: str
    alternatives: List[str] = []

class RecommendationData(BaseModel):
    recommendations: List[RecommendationItem] = []
    summary: str = ""

class BugData(BaseModel):
    bugs: List[Dict[str, Any]] = []
    summary: str = ""

class ArchitectureData(BaseModel):
    overall_score: int = 0
    scores: Dict[str, int] = {}
    strengths: List[str] = []
    weaknesses: List[str] = []
    recommendations: List[str] = []

class GenericData(BaseModel):
    data: Any
