# Frontend (Next.js) ↔ Backend (Python) Integration

## Architecture Overview

```
┌─────────────────────────┐         ┌──────────────────────────┐
│   Vercel (Next.js)      │         │   Railway (Python)       │
│                         │         │                          │
│  metaads.vercel.app     │  HTTP   │  metaads-python.railway  │
│                         │ ──────> │                          │
│  /api/campaign/create   │         │  /api/campaign/create    │
│  (API Route)            │         │  (Flask Endpoint)        │
└─────────────────────────┘         └──────────────────────────┘
```

## How It Works

### 1. User Interaction (Frontend)
```typescript
// src/app/page.tsx
const handleSubmit = async (message: string) => {
  const response = await fetch('/api/campaign/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, userId })
  });
  const data = await response.json();
}
```

### 2. Next.js API Route (Proxy)
```typescript
// src/app/api/campaign/create/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json();
  
  // Call Python backend on Railway
  const pythonApiUrl = process.env.EXTERNAL_API_URL || 'https://metaads-python.railway.app';
  
  const response = await fetch(`${pythonApiUrl}/api/campaign/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  
  const data = await response.json();
  return NextResponse.json(data);
}
```

### 3. Python AI Processing (Backend)
```python
# app.py on Railway
@app.route('/api/campaign/create', methods=['POST'])
def create_campaign():
    data = request.json
    message = data.get('message')
    
    # Process with AI agents
    result = await process_campaign_request(message)
    
    return jsonify({
        "success": True,
        "campaign": result.campaign,
        "content": result.content
    })
```

## Setup Steps

### Step 1: Deploy Python Backend to Railway
```bash
# Create new Python service in Railway
1. Railway Dashboard → "Meta ads" project
2. Click "+ New" → "Empty Service"
3. Name: "metaads-python"
4. Connect GitHub repo
5. Get URL: https://metaads-python.railway.app
```

### Step 2: Configure Vercel Environment
```bash
# In Vercel Dashboard
EXTERNAL_API_URL=https://metaads-python.railway.app
```

### Step 3: Update Next.js API Route
The route is already configured to use `EXTERNAL_API_URL` when available!

## Data Flow Example

1. **User types**: "Create Instagram ads for my coffee shop, $50/day"

2. **Frontend sends to**: `/api/campaign/create`
   ```json
   {
     "message": "Create Instagram ads for my coffee shop, $50/day",
     "userId": "user123"
   }
   ```

3. **Next.js API route forwards to Python**:
   ```
   POST https://metaads-python.railway.app/api/campaign/create
   ```

4. **Python AI agents process**:
   - Parser Agent extracts: budget=$50, platform=Instagram, business=coffee
   - Creative Agent generates: ad copy and headlines
   - Builder Agent structures: campaign for Meta Ads

5. **Python returns**:
   ```json
   {
     "success": true,
     "campaign": {
       "id": "camp-123",
       "name": "Coffee Shop Instagram Campaign",
       "budget": "$50/day"
     },
     "content": [{
       "headline": "Best Coffee in Town",
       "text": "Visit us for artisan roasted coffee",
       "cta": "Get Directions"
     }]
   }
   ```

6. **Frontend displays**: Beautiful UI with campaign details

## Benefits of This Architecture

1. **Separation of Concerns**
   - Frontend: UI/UX, user interaction
   - Backend: AI processing, heavy computation

2. **Independent Scaling**
   - Scale Python service for AI load
   - Scale Next.js for user traffic

3. **Technology Freedom**
   - Use best tools for each job
   - Next.js for reactive UI
   - Python for AI/ML

4. **Easy Development**
   - Frontend devs work on Next.js
   - AI devs work on Python
   - Clear API contract

## Security Considerations

1. **API Key Protection**
   - OpenAI key only on Python backend
   - Never exposed to frontend

2. **CORS Configuration**
   - Python backend allows Vercel domain
   - Blocks unauthorized access

3. **Rate Limiting**
   - Implement on both services
   - Prevent abuse

## Testing the Integration

### Local Testing
```bash
# Terminal 1: Run Python backend
cd metaads-new
python app.py

# Terminal 2: Run Next.js frontend
npm run dev

# Terminal 3: Test
curl http://localhost:3000/api/campaign/create \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"message":"Test campaign"}'
```

### Production Testing
```bash
# Test Python directly
curl https://metaads-python.railway.app/api/campaign/create \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"message":"Test campaign"}'

# Test through Next.js
curl https://metaads.vercel.app/api/campaign/create \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"message":"Test campaign"}'
```

## Deployment Checklist

- [ ] Python service deployed on Railway
- [ ] Environment variable set in Vercel: `EXTERNAL_API_URL`
- [ ] CORS enabled in Python app
- [ ] Health check endpoint working
- [ ] API endpoints tested
- [ ] Error handling in place
- [ ] Monitoring configured