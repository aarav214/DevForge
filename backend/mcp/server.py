import os
import sys
from dotenv import load_dotenv
from fastmcp import FastMCP
from backend.mcp.tools import register_repository_tools, register_ai_tools
from backend.core.logger import logger

# Load environment variables strictly from .env
load_dotenv()

# Startup validation
def validate_config():
    workspace_root = os.getenv("WORKSPACE_ROOT")
    if not workspace_root or not os.path.isdir(workspace_root):
        logger.error(f"Startup failed: WORKSPACE_ROOT must be a valid directory. Got: {workspace_root}")
        sys.exit(1)
        
    provider = os.getenv("LLM_PROVIDER", "kaggle")
    if provider == "gemini":
        if not os.getenv("GEMINI_API_KEY"):
            logger.error("Startup failed: GEMINI_API_KEY must be set when LLM_PROVIDER is gemini.")
            sys.exit(1)

validate_config()

# Initialize FastMCP Server
mcp = FastMCP("DevForge")

# Register cleanly encapsulated tool sets
register_repository_tools(mcp)
register_ai_tools(mcp)

if __name__ == "__main__":
    mcp.run()
