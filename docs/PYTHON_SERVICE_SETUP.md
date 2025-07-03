# Python AI Agent Service Setup

This guide explains how to set up and deploy the Python service that powers the AI agents for MetaAds.

## Overview

The Python service runs the LangGraph multi-agent system that processes natural language requests and creates optimized marketing campaigns. It includes:

- **Supervisor Agent**: Orchestrates the workflow
- **Parser Agent**: Extracts structured data from natural language
- **Creative Agent**: Generates compelling ad copy
- **Builder Agent**: Structures campaigns for Meta Ads API

## Local Development Setup

### 1. Install Python 3.9+

```bash
# Check Python version
python3 --version

# Should be 3.9 or higher
```

### 2. Create Virtual Environment

```bash
cd /path/to/metaads-new
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install -r agent-requirements.txt
```

### 4. Set Environment Variables

Create a `.env` file in the project root:

```env
# Required for AI agents
OPENAI_API_KEY=your_openai_api_key_here

# Optional: LangSmith monitoring
LANGCHAIN_TRACING_V2=true
LANGCHAIN_ENDPOINT=https://api.smith.langchain.com
LANGCHAIN_API_KEY=your_langsmith_api_key_here
LANGCHAIN_PROJECT=metaads-production
```

### 5. Test the Service

```bash
# Run the test script
python test_agent_workflow.py

# Test the API bridge (what Next.js calls)
python src/agents/api_bridge.py --message "Create a campaign for my app" --user_id test
```

## Production Deployment Options

### Option 1: Vercel Functions (Recommended for MVP)

While Vercel primarily supports Node.js, you can use a serverless Python runtime:

1. Install Vercel Python runtime:
```bash
npm install -D @vercel/python
```

2. Create `api/python/campaign.py`:
```python
from src.agents.api_bridge import main
import asyncio

def handler(request):
    message = request.json.get('message')
    user_id = request.json.get('userId')
    
    # Run the async workflow
    result = asyncio.run(main(message, user_id))
    
    return {
        'statusCode': 200,
        'body': result
    }
```

3. Update `vercel.json`:
```json
{
  "functions": {
    "api/python/campaign.py": {
      "runtime": "@vercel/python@3.0.0"
    }
  }
}
```

### Option 2: Separate Python Service (Recommended for Scale)

Deploy the Python service separately on:

#### Railway.app
1. Connect your GitHub repo
2. Set environment variables
3. Add `Procfile`:
```
web: gunicorn app:app
```

4. Create `app.py`:
```python
from flask import Flask, request, jsonify
from src.agents.api_bridge import main
import asyncio

app = Flask(__name__)

@app.route('/api/campaign/create', methods=['POST'])
def create_campaign():
    data = request.json
    result = asyncio.run(main(data['message'], data.get('userId')))
    return jsonify(result)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

#### Google Cloud Run
1. Create `Dockerfile`:
```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY agent-requirements.txt .
RUN pip install -r agent-requirements.txt

COPY src/ ./src/
COPY app.py .

CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 app:app
```

2. Deploy:
```bash
gcloud run deploy metaads-agents \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Option 3: AWS Lambda

1. Create deployment package:
```bash
pip install -r agent-requirements.txt -t lambda_package/
cp -r src/ lambda_package/
cd lambda_package
zip -r ../deployment.zip .
```

2. Create Lambda function and upload the zip

3. Set handler to `lambda_function.handler`

## Environment Variables for Production

```env
# Required
OPENAI_API_KEY=sk-...
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
META_ACCESS_TOKEN=your_access_token

# Recommended
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=ls__...
LANGCHAIN_PROJECT=metaads-production

# Performance
PYTHON_AGENT_TIMEOUT=30
MAX_CONCURRENT_REQUESTS=10
CACHE_TTL=3600
```

## Monitoring and Debugging

### 1. Enable LangSmith Tracing

LangSmith provides detailed traces of agent execution:

```python
import os
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_PROJECT"] = "metaads-debug"
```

### 2. View Agent Logs

```python
import logging
logging.basicConfig(level=logging.INFO)

# In your agents
logger = logging.getLogger(__name__)
logger.info("Processing campaign request", extra={"request": user_request})
```

### 3. Test Individual Agents

```python
# Test parser agent
from src.agents.parser import CampaignParserAgent
parser = CampaignParserAgent()
result = await parser.process(state)
```

## Performance Optimization

### 1. Use Caching

```python
from functools import lru_cache

@lru_cache(maxsize=100)
def get_cached_embeddings(text):
    # Cache frequently used embeddings
    pass
```

### 2. Batch Requests

```python
# Process multiple campaigns in parallel
import asyncio

async def process_batch(requests):
    tasks = [process_campaign_request(req) for req in requests]
    return await asyncio.gather(*tasks)
```

### 3. Use Smaller Models for Simple Tasks

```python
# Use GPT-3.5 for parsing, GPT-4 only for creative
model = "gpt-3.5-turbo" if task == "parse" else "gpt-4-turbo-preview"
```

## Troubleshooting

### Common Issues

1. **"OpenAI API key not configured"**
   - Set `OPENAI_API_KEY` environment variable
   - Check `.env` file is in the correct location

2. **Import errors**
   - Ensure `PYTHONPATH` includes the `src` directory
   - Check virtual environment is activated

3. **Timeout errors**
   - Increase timeout settings
   - Use streaming for long operations

4. **Memory issues**
   - Limit concurrent requests
   - Clear agent memory between requests

### Debug Commands

```bash
# Check environment
python -c "import os; print(os.getenv('OPENAI_API_KEY')[:10] + '...')"

# Test imports
python -c "from agents.workflow import process_campaign_request; print('✓ Imports working')"

# Run with debug logging
LOG_LEVEL=DEBUG python test_agent_workflow.py
```

## Security Best Practices

1. **API Key Management**
   - Never commit API keys
   - Use environment variables
   - Rotate keys regularly

2. **Input Validation**
   - Sanitize user inputs
   - Limit request size
   - Validate campaign parameters

3. **Rate Limiting**
   - Implement per-user limits
   - Use Redis for tracking
   - Return 429 for exceeded limits

4. **Error Handling**
   - Never expose internal errors
   - Log errors securely
   - Return generic error messages

## Next Steps

1. **Connect Meta Ads API**
   - Implement OAuth flow
   - Add campaign creation endpoints
   - Handle API responses

2. **Add More Agents**
   - Analytics agent for reporting
   - Optimization agent for A/B testing
   - Budget allocation agent

3. **Improve AI Quality**
   - Fine-tune prompts
   - Add more examples
   - Implement feedback loop

## Support

For issues or questions:
- Check logs in LangSmith
- Review error messages
- Test with simplified inputs
- Contact the development team