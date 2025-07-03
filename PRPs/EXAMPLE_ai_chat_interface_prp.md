# Product Requirements Prompt (PRP) - AI Chat Interface

## 1. Goal / Why / What

### Goal
Implement a conversational AI interface that allows users to manage Meta Ads campaigns through natural language interactions.

### Why
- Simplify campaign management for non-technical users
- Enable quick campaign adjustments without navigating complex UIs
- Provide intelligent suggestions based on campaign performance
- Offer 24/7 assistance for campaign optimization

### What
- Real-time chat interface with streaming responses
- Context-aware conversations with session memory
- Integration with all four AI agents (Campaign, Optimization, Reporting, Creative)
- Natural language to Meta API action translation
- Visual feedback for campaign changes

## 2. All Needed Context

### Documentation to Read
- [ ] LangGraph Docs: /docs/cloud/streaming for streaming responses
- [ ] Next.js 15: /docs/app/building-your-application/routing/route-handlers#streaming
- [ ] Meta Marketing API: /docs/marketing-api/conversions-api
- [ ] shadcn/ui Chat Components: /docs/components/chat
- [ ] SSE Implementation: MDN Server-Sent Events guide

### Examples to Reference
- [ ] Agent Integration: `examples/agent-api-integration.ts`
- [ ] Streaming Pattern: `src/app/api/agents/route.ts` (GET method)
- [ ] Component Pattern: `examples/component-pattern.tsx`
- [ ] Chat UI: Look at similar implementations in v0.dev

### Known Constraints & Gotchas
- SSE has 64KB limit per message - chunk large responses
- Browser connection limit: 6 concurrent SSE connections
- LangGraph memory must be persisted between requests
- Meta API changes are async - need status polling
- Mobile keyboards can cover chat input

## 3. Implementation Blueprint

### Data Models
```typescript
// Chat message types
interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  metadata?: {
    agentType?: string
    actionsTaken?: string[]
    campaignId?: string
    error?: string
  }
}

interface ChatSession {
  id: string
  userId: string
  messages: ChatMessage[]
  context: {
    selectedAccountId?: string
    activeCampaignId?: string
    lastAction?: string
  }
  createdAt: Date
  lastActivityAt: Date
}

// Agent action types
interface AgentAction {
  type: 'create' | 'update' | 'analyze' | 'optimize'
  entity: 'campaign' | 'adset' | 'ad' | 'audience'
  parameters: Record<string, any>
  requiresConfirmation: boolean
}
```

### Database Changes
```sql
-- Chat sessions table
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  context JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  last_activity_at TIMESTAMP DEFAULT NOW()
);

-- Chat messages table
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_chat_sessions_last_activity ON chat_sessions(last_activity_at);
```

### Task List
1. [ ] Backend Implementation
   - [ ] Create chat session management in `src/lib/chat/`
   - [ ] Implement message persistence layer
   - [ ] Create agent orchestrator for routing requests
   - [ ] Set up SSE endpoint for streaming

2. [ ] Agent Integration
   - [ ] Create chat adapter for each agent type
   - [ ] Implement intent recognition system
   - [ ] Add confirmation flow for destructive actions
   - [ ] Create response formatting utilities

3. [ ] Frontend Chat UI
   - [ ] Create `src/components/chat/chat-interface.tsx`
   - [ ] Implement message bubble components
   - [ ] Add typing indicators and loading states
   - [ ] Create quick action buttons
   - [ ] Implement file upload for creatives

4. [ ] Real-time Features
   - [ ] Set up EventSource connection management
   - [ ] Implement reconnection logic
   - [ ] Add connection status indicator
   - [ ] Handle message queuing when offline

5. [ ] Enhanced Features
   - [ ] Add voice input support (Web Speech API)
   - [ ] Implement message search
   - [ ] Create chat history export
   - [ ] Add suggested prompts

### Pseudocode / Key Logic
```typescript
// Agent orchestrator
class ChatOrchestrator {
  async processMessage(message: string, session: ChatSession) {
    // 1. Detect intent
    const intent = await this.detectIntent(message)
    
    // 2. Route to appropriate agent
    const agent = this.selectAgent(intent)
    
    // 3. Extract parameters
    const params = await this.extractParameters(message, intent)
    
    // 4. Check if confirmation needed
    if (this.requiresConfirmation(intent)) {
      return this.createConfirmationResponse(intent, params)
    }
    
    // 5. Execute action
    const result = await agent.execute(intent.action, params)
    
    // 6. Format response
    return this.formatResponse(result, intent)
  }
  
  streamResponse(response: AsyncGenerator<string>) {
    // Stream chunks via SSE
    for await (const chunk of response) {
      this.sendSSE({ type: 'chunk', data: chunk })
    }
    this.sendSSE({ type: 'done' })
  }
}
```

## 4. Integration Points

### API Routes
- `POST /api/chat/sessions` - Create new chat session
- `GET /api/chat/sessions/[id]` - Get session with messages
- `POST /api/chat/messages` - Send message (returns immediate ack)
- `GET /api/chat/stream` - SSE endpoint for streaming responses

### Agent Integration
```typescript
// Route to specific agents based on intent
const agentRouting = {
  'create_campaign': 'campaign-creator',
  'optimize_performance': 'optimization',
  'generate_report': 'reporting',
  'create_ad_creative': 'creative'
}
```

### Frontend Routes
- `/ai-lab` - Main chat interface
- `/ai-lab/history` - Chat history browser
- `/ai-lab/settings` - AI preferences

## 5. Validation & Testing

### Step 1: Component Testing
```bash
# Test chat components in isolation
npm test -- src/components/chat
```

### Step 2: Agent Integration Testing
```python
# Test agent intent detection
python -m pytest src/agents/tests/test_orchestrator.py

# Test streaming responses
python -m pytest src/agents/tests/test_streaming.py
```

### Step 3: E2E Testing
- [ ] Send message and verify response
- [ ] Test streaming for long responses
- [ ] Verify session persistence
- [ ] Test reconnection after disconnect
- [ ] Validate mobile responsiveness

### Step 4: Performance Testing
- [ ] Measure response time (target < 2s for first token)
- [ ] Test with 50 concurrent sessions
- [ ] Verify memory usage stays stable
- [ ] Check SSE connection pooling

## 6. Success Criteria

### Functional Requirements
- [ ] Users can create campaigns via natural language
- [ ] System understands campaign optimization requests
- [ ] Chat maintains context across messages
- [ ] Actions require confirmation when destructive
- [ ] Errors are explained in plain language

### Technical Requirements
- [ ] Response streaming works smoothly
- [ ] Sessions persist across page reloads
- [ ] Mobile experience is responsive
- [ ] Handles network interruptions gracefully
- [ ] Integrates with all four agents

### Performance Requirements
- [ ] First token appears within 2 seconds
- [ ] Complete responses within 10 seconds
- [ ] Supports 100+ concurrent users
- [ ] Chat history loads instantly

## 7. Anti-Patterns to Avoid

### Common Mistakes
- ❌ Sending entire response at once (use streaming)
- ❌ Losing context between messages
- ❌ Not handling network disconnections
- ❌ Allowing unlimited message length
- ❌ Not sanitizing user inputs

### MetaAds-Specific
- ❌ Executing Meta API calls without confirmation
- ❌ Not showing loading states during API calls
- ❌ Forgetting to check user permissions
- ❌ Not handling rate limit errors gracefully
- ❌ Exposing internal error messages to users

## 8. Rollback Plan

If issues arise:
1. Disable AI Lab feature flag
2. Clear chat_sessions table if corrupted
3. Fall back to traditional UI
4. Retain chat history for debugging

## 9. Documentation Updates

After implementation:
- [ ] Create user guide for AI Lab
- [ ] Document supported commands
- [ ] Add troubleshooting section
- [ ] Create video tutorials
- [ ] Update API documentation

---

**Remember**: The chat interface is the primary interaction point for many users. Prioritize reliability, clear communication, and graceful error handling.