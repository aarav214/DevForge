from typing import Union
from fastmcp import FastMCP
from backend.services.scan_service import scan_service
from backend.services.ai_service import ai_service
from backend.schemas.models import (
    ScanRequest, 
    AskRequest, 
    ModeEnum, 
    RepositorySummary,
    RecommendationData,
    BugData,
    ArchitectureData,
    GenericData
)
from backend.core.exceptions import DevForgeError
from backend.core.logger import logger

def register_repository_tools(mcp: FastMCP):
    @mcp.tool()
    def scan_repository(repository_path: str) -> RepositorySummary:
        """
        Scans a repository on the local filesystem to extract framework, language, and dependency metadata.
        This must be called before using the ask_devforge tool on any repository.
        Returns a rich RepositorySummary object detailing the tech stack.
        """
        try:
            req = ScanRequest(repository_path=repository_path)
            summary = scan_service.process(req)
            return summary
        except ValueError:
            raise
        except DevForgeError as e:
            raise ValueError(e.message)
        except Exception as e:
            logger.exception("Internal error in scan_repository MCP tool")
            raise RuntimeError("Internal server error")

def register_ai_tools(mcp: FastMCP):
    @mcp.tool()
    def ask_devforge(
        repository_path: str, 
        mode: str, 
        query: str
    ) -> Union[RecommendationData, BugData, ArchitectureData, GenericData]:
        """
        Asks the DevForge AI a software engineering question about a previously scanned repository.
        Allowed modes:
        - "recommend": Suggests libraries or packages.
        - "bug": Identifies potential bugs or issues in code.
        - "architecture": Reviews the architecture and scores it.
        - "chat": Generic chat interaction.
        Requires the repository to be scanned first using scan_repository.
        """
        try:
            try:
                mode_enum = ModeEnum(mode)
            except ValueError:
                allowed_modes = [m.value for m in ModeEnum]
                raise ValueError(f"Invalid mode. Allowed modes are: {allowed_modes}")
                
            req = AskRequest(mode=mode_enum, query=query, repository_path=repository_path)
            response_data = ai_service.process(req)
            return response_data
        except ValueError:
            raise
        except DevForgeError as e:
            raise ValueError(e.message)
        except Exception as e:
            logger.exception("Internal error in ask_devforge MCP tool")
            raise RuntimeError("Internal server error")
