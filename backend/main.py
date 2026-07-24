from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router
import os
import sys
from core.logger import logger
from core.exceptions import DevForgeError

app = FastAPI(title="DevForge AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    workspace_root = os.getenv("WORKSPACE_ROOT", os.getcwd())
    if not os.path.exists(workspace_root):
        logger.error(f"WORKSPACE_ROOT does not exist: {workspace_root}")
        sys.exit(1)
    logger.info("Startup validation passed.")

from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": {"code": f"HTTP_{exc.status_code}", "message": str(exc.detail)}}
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"success": False, "error": {"code": "VALIDATION_ERROR", "message": str(exc.errors())}}
    )

@app.exception_handler(DevForgeError)
async def devforge_exception_handler(request: Request, exc: DevForgeError):
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": {"code": exc.code, "message": exc.message}}
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": {"code": "INTERNAL_ERROR", "message": "An unexpected error occurred."}}
    )

app.include_router(router)

@app.get("/health")
def health_check():
    return {"status": "healthy"}
