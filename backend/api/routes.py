import os
from fastapi import APIRouter
from backend.schemas.models import ScanRequest, APIResponse, RepositorySummary, AskRequest
from backend.core.parser import RepositoryParser
from backend.core.cache import repo_cache
from backend.core.logger import logger
from backend.core.exceptions import DevForgeError
from backend.services.ai_service import ai_service
from backend.services.scan_service import scan_service
router = APIRouter()

@router.post("/scan", response_model=APIResponse)
def scan_repository(request: ScanRequest):
    logger.info(f"Delegating /scan to scan_service")
    summary = scan_service.process(request)
    return APIResponse(success=True, mode="scan", data=summary.model_dump())

@router.post("/ask", response_model=APIResponse)
def ask_ai(request: AskRequest):
    logger.info(f"Processing /ask for mode {request.mode}")
    result_data = ai_service.process(request)
    return APIResponse(success=True, mode=request.mode, data=result_data.model_dump())
