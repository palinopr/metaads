# AI Marketing Automation - CEO's Quick Start Guide

> "From zero to hero in 10 minutes. That's my promise." - CEO

## 🚀 5-Minute Setup

### Prerequisites
```bash
# Check you have everything
python --version  # Need 3.9+
node --version    # Need 18+
```

### 1. Clone and Enter the Kingdom
```bash
git clone [your-repo-url]
cd ai-marketing-automation
```

### 2. Install Dependencies (2 min)
```bash
# Python dependencies
pip install -r requirements.txt

# Node dependencies  
npm install
```

### 3. Configure Your Empire (1 min)
```bash
# Copy environment template
cp .env.example .env

# Edit .env and add:
# - OPENAI_API_KEY (required)
# - ANTHROPIC_API_KEY (optional but recommended)
# - Database URL (use SQLite for quick start)
```

### 4. Initialize Database (30 sec)
```bash
# For quick start with SQLite
python scripts/init_db.py

# Or use npm scripts
npm run db:push
```

### 5. Launch! (30 sec)
```bash
# Start the development server
npm run dev

# In another terminal, test the agents
python src/workflows/complete_campaign_workflow.py
```

## 🎯 Your First Campaign (2 min)

### Via API
```python
import asyncio
from src.workflows.complete_campaign_workflow import create_campaign_magic

async def my_first_campaign():
    result = await create_campaign_magic(
        "Create a Facebook campaign for my yoga app targeting women 25-40 in NYC with $100/day budget",
        user_id="quickstart_user"
    )
    print(result["final_deliverables"])

asyncio.run(my_first_campaign())
```

### Via Web UI
1. Open http://localhost:3000
2. Type: "I want to promote my product"
3. Watch the magic happen!

## 🧪 Test Our Agents

### Test Individual Agents
```bash
# Test Campaign Creator
python src/agents/campaign_creator_agent.py

# Test Content Generator
python src/agents/content_generation_agent.py

# Test Optimizer
python src/agents/optimization_agent.py

# Test Complete Workflow
npm run workflow:demo
```

### Run All Tests
```bash
# Python tests
pytest src/agents/

# JavaScript tests
npm test
```

## 📊 CEO Dashboard

### Real-time Metrics
- Open http://localhost:3000/dashboard
- See all agent activity
- Monitor performance
- Track success rates

### LangSmith Integration
1. Get your API key from https://smith.langchain.com
2. Add to .env: `LANGCHAIN_API_KEY=your_key`
3. All workflows are now traced!

## 🎮 Quick Commands

### Development
```bash
npm run dev          # Start Next.js dev server
npm run agents:test  # Test all agents
npm run workflow:demo # Run CEO demo
```

### Database
```bash
npm run db:studio    # Visual database browser
npm run db:push      # Update schema
```

### Production
```bash
npm run build        # Build for production
npm start           # Start production server
```

## 🚨 Common Issues & CEO Solutions

### "No API Key" Error
**Solution**: Copy `.env.example` to `.env` and add your keys

### "Import Error" in Python
**Solution**: 
```bash
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
```

### "Port 3000 in use"
**Solution**:
```bash
lsof -ti:3000 | xargs kill -9
```

### Slow First Run
**Solution**: First run downloads models. Grab coffee, it's worth the wait!

## 🎯 What's Next?

### Immediate Value (Today)
1. Create your first campaign
2. Generate 10 ad variations
3. See optimization suggestions

### This Week
1. Connect your Meta Ads account
2. Launch a real campaign
3. Watch AI optimize it

### This Month
1. Scale to 100 campaigns
2. A/B test everything
3. Dominate your market

## 💬 Need Help?

### Quick Support
- Check `/docs` folder
- Read agent docstrings
- Review examples in `/examples`

### Direct Line to CEO
- GitHub Issues: [your-repo]/issues
- Email: ceo@aimarketingautomation.com
- Discord: [Join our community]

## 🏆 CEO's Personal Tips

1. **Start Simple**: Create one campaign, see the magic
2. **Trust the AI**: It knows marketing better than most humans
3. **Iterate Fast**: Launch, learn, improve
4. **Scale Winners**: When something works, 10x it
5. **Kill Losers**: Don't waste money on hope

## 🚀 Ready to Revolutionize Marketing?

You now have the most powerful marketing automation platform at your fingertips.

**Your mission**: Create your first campaign in the next 5 minutes.

**My promise**: It will be better than anything you could create manually.

Let's build the future together!

---

*"The best time to automate your marketing was yesterday. The second best time is now."*

**- Your CEO**