# INITIAL: Deploy AI Agents to Railway using CLI

## Context
We have a working AI marketing automation platform with Python/LangGraph agents that need to be deployed. Vercel doesn't support complex Python, so we're using Railway which has full Python support.

## Current State
- Frontend: Deployed on Vercel (working)
- Python Agents: Working locally with LangGraph
- Railway Config: Files created but not deployed
- User has Railway CLI available

## Requirements
1. Use Railway CLI for deployment (not web dashboard)
2. Follow context engineering principles
3. Set up proper environment variables
4. Connect to existing Vercel frontend
5. Enable production-ready AI agents

## Technical Decisions
- Use Flask as web server (already configured)
- Gunicorn for production WSGI
- Keep agents modular and scalable
- Support both demo mode and AI mode

## Success Criteria
- Railway deployment accessible via public URL
- AI agents processing requests with OpenAI
- Frontend successfully calling Railway backend
- Monitoring and logs available
- Zero downtime deployments

## Constraints
- Must work with existing GitHub repo
- Maintain compatibility with Vercel frontend
- Handle missing API keys gracefully
- Cost-effective (under $20/month)