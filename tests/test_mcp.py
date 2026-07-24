import pytest
from backend.mcp.server import mcp

@pytest.mark.asyncio
async def test_invalid_path():
    with pytest.raises(Exception, match="Path must be an existing directory"):
        await mcp.call_tool("scan_repository", {"repository_path": "/home/suzi/WORKSPACE/Projects/devforge-ai/does_not_exist"})

@pytest.mark.asyncio
async def test_workspace_restriction():
    with pytest.raises(Exception, match="outside the configured workspace root"):
        await mcp.call_tool("scan_repository", {"repository_path": "/tmp"})

@pytest.mark.asyncio
async def test_invalid_mode():
    with pytest.raises(Exception, match="Invalid mode"):
        await mcp.call_tool("ask_devforge", {"repository_path": "/home/suzi/WORKSPACE/Projects/devforge-ai", "mode": "invalid_mode_xyz", "query": "test"})

@pytest.mark.asyncio
async def test_cache_miss_successful_scan():
    res = await mcp.call_tool("scan_repository", {"repository_path": "/home/suzi/WORKSPACE/Projects/devforge-ai"})
    assert res is not None

@pytest.mark.asyncio
async def test_cache_hit_successful_scan():
    res = await mcp.call_tool("scan_repository", {"repository_path": "/home/suzi/WORKSPACE/Projects/devforge-ai"})
    assert res is not None

@pytest.mark.asyncio
async def test_successful_ai_response():
    res = await mcp.call_tool("ask_devforge", {"repository_path": "/home/suzi/WORKSPACE/Projects/devforge-ai", "mode": "recommend", "query": "I need auth"})
    assert res is not None
