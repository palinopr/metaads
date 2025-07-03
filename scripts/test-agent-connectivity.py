#!/usr/bin/env python3

"""
Agent Connectivity Test Script
Tests AI agent setup, LLM connections, and tool availability
"""

import os
import sys
import json
import asyncio
from typing import Dict, Any, List
from datetime import datetime
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# Color codes for terminal output
class Colors:
    RESET = '\033[0m'
    GREEN = '\033[32m'
    RED = '\033[31m'
    YELLOW = '\033[33m'
    BLUE = '\033[34m'

# Test results
results = {
    'passed': [],
    'warnings': [],
    'failed': []
}

def log(message: str, color: str = 'RESET'):
    """Print colored message"""
    print(f"{getattr(Colors, color)}{message}{Colors.RESET}")

def add_result(category: str, message: str):
    """Add test result"""
    results[category].append(message)

async def test_llm_connection():
    """Test connection to LLM providers"""
    log("\nTesting LLM connections...", "YELLOW")
    
    # Test OpenAI
    try:
        from langchain_openai import ChatOpenAI
        
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key or "placeholder" in api_key:
            add_result('failed', 'OpenAI API key not configured')
        else:
            llm = ChatOpenAI(
                api_key=api_key,
                model="gpt-3.5-turbo",
                temperature=0
            )
            
            # Test simple completion
            response = await llm.ainvoke("Say 'test successful'")
            if "test successful" in response.content.lower():
                add_result('passed', 'OpenAI connection successful')
            else:
                add_result('failed', 'OpenAI returned unexpected response')
                
    except ImportError:
        add_result('failed', 'langchain-openai not installed')
    except Exception as e:
        add_result('failed', f'OpenAI connection failed: {str(e)}')
    
    # Test Anthropic
    try:
        from langchain_anthropic import ChatAnthropic
        
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key or "placeholder" in api_key:
            add_result('warnings', 'Anthropic API key not configured (optional)')
        else:
            llm = ChatAnthropic(
                api_key=api_key,
                model="claude-3-haiku-20240307",
                temperature=0
            )
            
            response = await llm.ainvoke("Say 'test successful'")
            if "test successful" in response.content.lower():
                add_result('passed', 'Anthropic connection successful')
            else:
                add_result('failed', 'Anthropic returned unexpected response')
                
    except ImportError:
        add_result('warnings', 'langchain-anthropic not installed')
    except Exception as e:
        add_result('warnings', f'Anthropic connection failed: {str(e)}')

async def test_agent_imports():
    """Test if agent modules can be imported"""
    log("\nTesting agent imports...", "YELLOW")
    
    agents_dir = project_root / "src" / "agents"
    
    if not agents_dir.exists():
        add_result('failed', 'src/agents directory not found')
        return
    
    # Expected agents
    expected_agents = ['campaign-creator']  # Only this one exists currently
    
    for agent_name in expected_agents:
        agent_file = agents_dir / f"{agent_name}.py"
        
        if agent_file.exists():
            try:
                # Try to import the module
                import importlib.util
                spec = importlib.util.spec_from_file_location(
                    agent_name.replace('-', '_'), 
                    agent_file
                )
                module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(module)
                
                add_result('passed', f'Agent module imported: {agent_name}')
                
                # Check for required components
                has_tools = hasattr(module, 'analyze_business_objective') or \
                           any(name.endswith('_tool') for name in dir(module))
                
                if has_tools:
                    add_result('passed', f'Agent has tools defined: {agent_name}')
                else:
                    add_result('warnings', f'Agent may be missing tools: {agent_name}')
                    
            except Exception as e:
                add_result('failed', f'Failed to import {agent_name}: {str(e)}')
        else:
            add_result('warnings', f'Agent file not found: {agent_name}.py')

async def test_langgraph_setup():
    """Test LangGraph installation and basic functionality"""
    log("\nTesting LangGraph setup...", "YELLOW")
    
    try:
        from langgraph.graph import StateGraph, MessagesState
        from langgraph.checkpoint.memory import InMemorySaver
        
        add_result('passed', 'LangGraph imported successfully')
        
        # Test basic graph creation
        graph = StateGraph(MessagesState)
        
        # Add a simple node
        async def dummy_node(state):
            return {"messages": state["messages"]}
        
        graph.add_node("test", dummy_node)
        graph.set_entry_point("test")
        graph.set_finish_point("test")
        
        # Compile the graph
        compiled = graph.compile()
        
        add_result('passed', 'LangGraph graph compilation successful')
        
    except ImportError:
        add_result('failed', 'LangGraph not installed')
    except Exception as e:
        add_result('failed', f'LangGraph setup failed: {str(e)}')

async def test_meta_api_tools():
    """Test Meta API related tools and configurations"""
    log("\nTesting Meta API tools...", "YELLOW")
    
    # Check for Meta access token
    meta_token = os.getenv("META_ACCESS_TOKEN")
    if not meta_token:
        add_result('warnings', 'META_ACCESS_TOKEN not configured')
    else:
        add_result('passed', 'META_ACCESS_TOKEN is configured')
    
    # Check for facebook-nodejs-business-sdk (if needed for Python tools)
    try:
        import requests
        
        # Test basic Meta Graph API endpoint (without actual token)
        if meta_token and not "placeholder" in meta_token:
            response = requests.get(
                "https://graph.facebook.com/v18.0/me",
                params={"access_token": meta_token}
            )
            
            if response.status_code == 200:
                add_result('passed', 'Meta API connection successful')
            else:
                add_result('failed', f'Meta API returned status {response.status_code}')
        else:
            add_result('warnings', 'Skipping Meta API test (no valid token)')
            
    except Exception as e:
        add_result('failed', f'Meta API test failed: {str(e)}')

def test_agent_configs():
    """Test agent configuration file"""
    log("\nTesting agent configurations...", "YELLOW")
    
    config_file = project_root / "agent-configs.json"
    
    if not config_file.exists():
        add_result('failed', 'agent-configs.json not found')
        return
    
    try:
        with open(config_file, 'r') as f:
            config = json.load(f)
        
        add_result('passed', 'agent-configs.json loaded successfully')
        
        # Check configuration structure
        if "agents" in config:
            for agent_name, agent_config in config["agents"].items():
                if "enabled" in agent_config:
                    status = "enabled" if agent_config["enabled"] else "disabled"
                    add_result('passed', f'Agent {agent_name} is {status}')
                else:
                    add_result('warnings', f'Agent {agent_name} missing enabled flag')
                
                if "model" not in agent_config:
                    add_result('warnings', f'Agent {agent_name} missing model config')
                    
        else:
            add_result('failed', 'agent-configs.json missing agents section')
            
    except json.JSONDecodeError as e:
        add_result('failed', f'Invalid JSON in agent-configs.json: {str(e)}')
    except Exception as e:
        add_result('failed', f'Failed to read agent-configs.json: {str(e)}')

async def test_sample_agent_execution():
    """Test executing a simple agent task"""
    log("\nTesting sample agent execution...", "YELLOW")
    
    try:
        from langchain_openai import ChatOpenAI
        from langchain.tools import tool
        from langchain.agents import create_react_agent
        from langchain.prompts import ChatPromptTemplate
        
        # Create a simple tool
        @tool
        def get_time() -> str:
            """Get current time"""
            return datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # Create LLM
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key or "placeholder" in api_key:
            add_result('warnings', 'Skipping agent execution test (no API key)')
            return
        
        llm = ChatOpenAI(api_key=api_key, model="gpt-3.5-turbo", temperature=0)
        
        # Create agent
        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are a helpful assistant."),
            ("human", "{input}")
        ])
        
        agent = create_react_agent(
            llm=llm,
            tools=[get_time],
            prompt=prompt
        )
        
        # Test execution
        result = await agent.ainvoke({"input": "What time is it?"})
        
        if result and "output" in result:
            add_result('passed', 'Sample agent execution successful')
        else:
            add_result('failed', 'Agent execution returned unexpected result')
            
    except Exception as e:
        add_result('failed', f'Agent execution test failed: {str(e)}')

async def run_all_tests():
    """Run all connectivity tests"""
    log("\n🤖 MetaAds Agent Connectivity Test\n", "BLUE")
    
    # Run all tests
    await test_llm_connection()
    await test_agent_imports()
    await test_langgraph_setup()
    await test_meta_api_tools()
    test_agent_configs()
    await test_sample_agent_execution()
    
    # Display results
    log("\n📊 Test Results\n", "BLUE")
    
    if results['passed']:
        log(f"✅ Passed ({len(results['passed'])}):", "GREEN")
        for msg in results['passed']:
            log(f"   {msg}", "GREEN")
    
    if results['warnings']:
        log(f"\n⚠️  Warnings ({len(results['warnings'])}):", "YELLOW")
        for msg in results['warnings']:
            log(f"   {msg}", "YELLOW")
    
    if results['failed']:
        log(f"\n❌ Failed ({len(results['failed'])}):", "RED")
        for msg in results['failed']:
            log(f"   {msg}", "RED")
    
    # Summary
    total_tests = len(results['passed']) + len(results['warnings']) + len(results['failed'])
    success_rate = round((len(results['passed']) / total_tests) * 100) if total_tests > 0 else 0
    
    log("\n📈 Summary:", "BLUE")
    log(f"   Total tests: {total_tests}")
    log(f"   Success rate: {success_rate}%")
    
    if not results['failed']:
        log("\n✨ Agent connectivity test passed!", "GREEN")
        return 0
    else:
        log("\n❗ Please fix the failed tests before proceeding.", "RED")
        return 1

if __name__ == "__main__":
    # Run tests
    exit_code = asyncio.run(run_all_tests())
    sys.exit(exit_code)