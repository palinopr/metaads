# AI Marketing Automation Platform

> "Claude Code for Marketing" - Making sophisticated marketing campaigns as easy as having a conversation.

## Overview

This platform revolutionizes marketing automation by using conversational AI and multi-agent systems to handle campaign creation, optimization, and management. Built on LangGraph for reliable agent orchestration and Context Engineering for systematic development.

## Key Features

- **Conversational Interface**: Create campaigns using natural language
- **24/7 Optimization**: AI agents continuously monitor and improve performance  
- **Multi-Channel Support**: Manage campaigns across Meta, Google, TikTok, and more
- **Intelligent Insights**: Get actionable recommendations based on real-time data
- **Content Generation**: AI-powered ad copy and creative suggestions

## Architecture

The platform uses a sophisticated multi-agent system:

```
Marketing Supervisor Agent
├── Campaign Creator Agent - Builds campaign structures
├── Content Generation Agent - Creates compelling ad copy
├── Optimization Agent - Monitors and improves performance
├── Analytics Agent - Provides insights and predictions
├── Budget Management Agent - Allocates spending optimally
├── Audience Research Agent - Discovers new segments
└── Compliance Agent - Ensures policy adherence
```

## Quick Start

### Prerequisites

- Python 3.9+
- Node.js 18+
- PostgreSQL or SQLite
- API Keys: OpenAI, Anthropic, Meta Ads

### Installation

```bash
# Clone the repository
git clone [repository-url]
cd ai-marketing-automation

# Install Python dependencies
pip install -r requirements.txt

# Install Node dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Initialize database
python scripts/init_db.py

# Run the development server
npm run dev
```

### Create Your First Campaign

```python
# Using the conversational interface
request = """
Create a campaign to promote my fitness app to women 25-40 
interested in yoga in NYC with $500 weekly budget
"""

campaign = await create_campaign_from_request(request)
```

## Project Structure

```
ai-marketing-automation/
├── src/
│   ├── agents/          # Python agent implementations
│   ├── workflows/       # LangGraph workflow definitions
│   ├── app/            # Next.js frontend
│   ├── components/     # React components
│   └── lib/            # Utilities and integrations
├── examples/           # Code examples and patterns
├── PRPs/              # Product Requirements Prompts
├── tests/             # Test suites
└── docs/              # Additional documentation
```

## Development

### Creating a New Agent

1. Extend the base agent class:

```python
from examples.agents.base_agent import BaseMarketingAgent

class MyAgent(BaseMarketingAgent):
    def __init__(self):
        super().__init__("my_agent", "Description of agent")
    
    async def process(self, state):
        # Agent logic here
        return state
```

2. Add to a workflow:

```python
workflow = StateGraph(CampaignState)
workflow.add_node("my_agent", my_agent.process)
```

### Using Context Engineering

1. Create an INITIAL.md file describing your feature
2. Generate a comprehensive PRP:
   ```bash
   /generate-prp INITIAL.md
   ```
3. Execute the implementation:
   ```bash
   /execute-prp PRPs/your-feature.md
   ```

## Testing

```bash
# Run all tests
pytest

# Run specific test category
pytest tests/agents/
pytest tests/workflows/
pytest tests/integration/

# Run with coverage
pytest --cov=src tests/
```

## Monitoring

The platform includes comprehensive monitoring via LangSmith:

- Real-time agent execution traces
- Performance metrics and analytics
- Error tracking and debugging
- Cost analysis per operation

## API Documentation

### Campaign Creation API

```typescript
POST /api/campaigns/create
{
  "request": "Natural language campaign description",
  "user_id": "user_123"
}

Response:
{
  "campaign_id": "camp_456",
  "status": "draft",
  "preview_url": "/campaigns/camp_456"
}
```

### Optimization API

```typescript
POST /api/campaigns/{id}/optimize
{
  "optimization_type": "budget" | "targeting" | "creative",
  "auto_apply": boolean
}
```

## Contributing

1. Follow the Context Engineering workflow
2. Use provided agent and workflow templates
3. Write comprehensive tests
4. Update documentation

## Performance Benchmarks

- Campaign creation: < 3 seconds
- Optimization analysis: < 5 seconds
- Content generation: < 2 seconds
- Real-time updates via SSE

## Security

- All API keys stored securely
- Input validation on all endpoints
- Rate limiting implemented
- GDPR compliant data handling

## Roadmap

### Phase 1 (Current)
- ✅ Core agent infrastructure
- ✅ Campaign creation workflow
- ✅ Basic optimization
- 🔄 Frontend interface

### Phase 2
- Multi-channel orchestration
- Advanced content generation
- Predictive analytics
- Voice interface

### Phase 3
- Custom agent builder
- Marketplace for agent templates
- Enterprise features
- API for developers

## Support

- Documentation: `/docs`
- Examples: `/examples`
- Issues: GitHub Issues
- Discord: [Join our community]

## License

MIT License - see LICENSE file for details

---

Built with ❤️ using LangGraph and Context Engineering