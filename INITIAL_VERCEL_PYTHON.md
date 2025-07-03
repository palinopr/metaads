# INITIAL: Deploy Python AI Agents on Vercel

## Context
We have a working Python AI agent system using LangGraph that needs to be deployed on Vercel alongside our Next.js frontend. The system is currently working locally but needs to be accessible via API endpoints.

## Current State
- Frontend: Already deployed on Vercel at https://metaads-peach.vercel.app
- Python Agents: Working locally with test scripts
- API Bridge: src/agents/api_bridge.py connects Python to Next.js
- Dependencies: Listed in agent-requirements.txt

## Requirements
1. Deploy Python functions on Vercel using their Python runtime
2. Make the campaign creation endpoint work from the frontend
3. Handle environment variables (OPENAI_API_KEY)
4. Ensure proper error handling and demo mode
5. Minimize cold start times

## Technical Constraints
- Vercel Python runtime has limitations (no persistent state)
- Need to bundle dependencies properly
- Must work with existing Next.js API routes
- Should fail gracefully without API keys

## Expected Outcome
- Working /api/campaign/create endpoint using Python agents
- Frontend can successfully call Python AI agents
- Demo mode works without OpenAI API key
- Deployment is automatic on git push