import asyncio
import os
from mcp.client.stdio import stdio_client, StdioServerParameters
from mcp.client.session import ClientSession

async def run_integration_test():
    env = os.environ.copy()
    env["PYTHONPATH"] = os.getcwd()
    
    server_params = StdioServerParameters(
        command="python",
        args=["-m", "backend.mcp.server"],
        env=env
    )
    
    try:
        async with stdio_client(server_params) as (read, write):
            async with ClientSession(read, write) as session:
                await session.initialize()
                print("Server started and initialized.")
                
                # List tools
                tools = await session.list_tools()
                tool_names = [t.name for t in tools.tools]
                print(f"Discovered tools: {tool_names}")
                
                assert "scan_repository" in tool_names
                assert "ask_devforge" in tool_names
                
                print("Tool metadata:")
                for t in tools.tools:
                    print(f"  - {t.name}: {t.description}")
                    
                # Execute scan_repository successfully
                print("\nExecuting scan_repository...")
                result = await session.call_tool("scan_repository", arguments={"repository_path": "/home/suzi/WORKSPACE/Projects/devforge-ai"})
                print("Result:", result)
                assert not result.isError, "Tool returned an error when success was expected"
                
                # Execute ask_devforge successfully
                print("\nExecuting ask_devforge...")
                result = await session.call_tool("ask_devforge", arguments={"repository_path": "/home/suzi/WORKSPACE/Projects/devforge-ai", "mode": "recommend", "query": "Need help"})
                print("Result:", result)
                assert not result.isError, "Tool returned an error when success was expected"
                
                # Execute invalid path
                print("\nExecuting invalid path...")
                result = await session.call_tool("scan_repository", arguments={"repository_path": "/invalid/path"})
                print("Result:", result)
                assert result.isError, "Tool should have returned an error"
                assert "Access denied" in result.content[0].text or "Path must be an existing directory" in result.content[0].text
                assert "Traceback" not in result.content[0].text
                
                print("\nIntegration test fully passed!")
    except Exception as e:
        print(f"Integration test failed: {e}")

if __name__ == "__main__":
    asyncio.run(run_integration_test())
