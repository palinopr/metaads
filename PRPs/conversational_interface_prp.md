# Product Requirements Prompt (PRP) - Conversational Campaign Creation Interface

## 1. Goal / Why / What

### Goal
Create a conversational interface that guides non-technical salespeople through creating their first Meta ad campaign using simple Q&A, eliminating all marketing jargon and complexity.

### Why
- 90% of salespeople abandon Meta Ads due to overwhelming complexity
- Current tools require marketing knowledge salespeople don't have
- Conversation is the most natural interface for non-technical users
- Removing friction at campaign creation drives long-term retention

### What
- Chat-based campaign creation flow
- Plain English questions and responses
- Industry-optimized campaign templates
- One-click launch with safe defaults
- Daily performance summaries in simple terms

## 2. All Needed Context

### Documentation to Read
- [ ] Meta Marketing API: /marketing-api/reference/ad-campaign#Creating
- [ ] Meta Marketing API: /marketing-api/reference/ad-set#Creating
- [ ] Meta Marketing API: /marketing-api/reference/ad-creative#Creating
- [ ] Next.js 15 App Router: Server Actions for real-time chat
- [ ] Vercel AI SDK: For streaming responses

### Examples to Reference
- [ ] AI Lab interface: `src/components/ai-lab/ai-lab-interface.tsx`
- [ ] Chat UI components: `src/components/ui/card.tsx`
- [ ] Campaign creation API: `src/app/api/campaigns/route.ts`
- [ ] Message streaming: Review Vercel AI SDK examples

### Known Constraints & Gotchas
- Meta requires campaign → ad set → ad creation in sequence
- Minimum daily budget is $1 (we'll suggest $20 for results)
- Location targeting requires specific format
- Image assets need to be pre-uploaded or stock photos
- Conversation state must persist across page refreshes

## 3. Implementation Blueprint

### Data Models
```typescript
// Conversation flow state
interface ConversationState {
  id: string
  userId: string
  currentStep: ConversationStep
  context: {
    businessType?: string
    location?: string
    budget?: number
    targetAudience?: string
    campaignObjective?: 'LEADS' | 'SALES' | 'TRAFFIC'
  }
  messages: Message[]
  campaignDraft?: CampaignDraft
  createdAt: Date
  updatedAt: Date
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  metadata?: {
    inputType?: 'text' | 'selection' | 'budget'
    options?: string[]
  }
}

interface ConversationStep {
  id: string
  question: string
  inputType: 'text' | 'selection' | 'budget' | 'confirmation'
  options?: string[]
  validator?: (input: string) => boolean
  nextStep: (input: string, context: any) => string
}

// Industry templates
interface IndustryTemplate {
  id: string
  industry: string
  keywords: string[] // for matching user input
  defaults: {
    objective: string
    audienceInterests: string[]
    adCopy: {
      headline: string
      body: string
      cta: string
    }
    budgetMultiplier: number // relative to base budget
  }
}
```

### Database Changes
```sql
-- Conversation sessions
CREATE TABLE conversation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  current_step VARCHAR(50) NOT NULL DEFAULT 'welcome',
  context JSONB NOT NULL DEFAULT '{}',
  campaign_draft JSONB,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Conversation messages
CREATE TABLE conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES conversation_sessions(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Industry templates
CREATE TABLE industry_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry VARCHAR(100) NOT NULL,
  keywords TEXT[] NOT NULL,
  defaults JSONB NOT NULL,
  success_rate FLOAT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Performance translations (jargon to plain English)
CREATE TABLE performance_translations (
  metric_name VARCHAR(50) PRIMARY KEY,
  plain_english TEXT NOT NULL,
  explanation TEXT,
  good_threshold FLOAT,
  bad_threshold FLOAT
);

-- Insert default translations
INSERT INTO performance_translations VALUES
('ctr', 'Click Rate', 'How many people clicked your ad', 2.0, 0.5),
('cpc', 'Cost per Click', 'What you pay when someone clicks', 2.0, 5.0),
('cpm', 'Cost per 1000 Views', 'Price to show your ad 1000 times', 30.0, 100.0),
('conversions', 'Results', 'People who took action (called, signed up, etc)', null, null);
```

### Task List
1. [ ] Database setup
   - [ ] Create schema in `src/db/schema/conversation.ts`
   - [ ] Add industry templates data
   - [ ] Create performance translations
   - [ ] Generate and run migrations

2. [ ] Conversation Engine
   - [ ] Create `src/lib/conversation/engine.ts`
   - [ ] Define conversation flow steps
   - [ ] Implement context management
   - [ ] Create message formatting utilities

3. [ ] UI Components
   - [ ] Create `src/app/page.tsx` with chat interface
   - [ ] Build `src/components/chat/chat-interface.tsx`
   - [ ] Add `src/components/chat/message-bubble.tsx`
   - [ ] Create `src/components/chat/input-types.tsx`

4. [ ] API Implementation
   - [ ] Create `src/app/api/conversation/route.ts`
   - [ ] Implement `src/app/api/conversation/[sessionId]/route.ts`
   - [ ] Add streaming response support
   - [ ] Create campaign from conversation

5. [ ] Industry Intelligence
   - [ ] Build industry detection from keywords
   - [ ] Create default templates for top 10 industries
   - [ ] Implement smart budget recommendations
   - [ ] Add location-based adjustments

6. [ ] Campaign Creation
   - [ ] Map conversation to Meta campaign structure
   - [ ] Generate ad creative from templates
   - [ ] Set optimal targeting based on industry
   - [ ] Implement safety checks

### Pseudocode / Key Logic
```typescript
// Conversation flow engine
const conversationFlow = {
  welcome: {
    message: "Hi! I'm here to help you get more customers. What do you sell?",
    inputType: "text",
    next: (input: string) => "location"
  },
  location: {
    message: (ctx) => `Great! ${ctx.businessType} is a perfect fit. Where are your customers located?`,
    inputType: "text",
    next: (input: string) => "budget"
  },
  budget: {
    message: "What's your monthly marketing budget? (I'll suggest a safe daily amount)",
    inputType: "budget",
    next: (input: string) => "objective"
  },
  objective: {
    message: "What's most important to you right now?",
    inputType: "selection",
    options: [
      "Get more phone calls",
      "Get people to visit my website", 
      "Get email sign-ups",
      "Sell products online"
    ],
    next: (input: string) => "confirm"
  },
  confirm: {
    message: (ctx) => generateCampaignSummary(ctx),
    inputType: "confirmation",
    next: (input: string) => input === "yes" ? "creating" : "adjust"
  }
}

// Industry detection
function detectIndustry(userInput: string): IndustryTemplate | null {
  const normalized = userInput.toLowerCase()
  
  for (const template of industryTemplates) {
    if (template.keywords.some(keyword => normalized.includes(keyword))) {
      return template
    }
  }
  
  return genericTemplate
}

// Plain English performance
function translateMetrics(insights: CampaignInsights): string {
  const ctr = insights.ctr
  const cost = insights.spend
  const clicks = insights.clicks
  
  if (ctr > 2) {
    return `Great news! ${Math.round(ctr)}% of people who saw your ad clicked on it - that's above average! You spent $${cost} and got ${clicks} interested people.`
  } else if (ctr > 1) {
    return `Your ads are doing okay. ${clicks} people clicked after seeing your ad. Each click cost about $${(cost/clicks).toFixed(2)}.`
  } else {
    return `Your ads need some work. Only ${clicks} people clicked. Let me suggest some improvements...`
  }
}
```

## 4. Integration Points

### API Routes
- `POST /api/conversation` - Start new conversation
- `POST /api/conversation/[id]/message` - Send message
- `GET /api/conversation/[id]` - Get conversation state
- `POST /api/conversation/[id]/launch` - Create campaign

### Frontend Routes
- `/` - Main chat interface (replaces dashboard)
- `/campaigns` - Simple campaign list
- `/help` - Plain English guide

### External Services
- Meta Marketing API: Campaign/AdSet/Ad creation
- OpenAI: Industry understanding and response generation
- Stock photo API: Auto-select relevant images

## 5. Validation & Testing

### Step 1: Syntax & Type Checking
```bash
npm run lint
npm run typecheck
```

### Step 2: Conversation Flow Testing
```bash
# Test conversation engine
npm test -- src/lib/conversation/engine.test.ts

# Test industry detection
npm test -- src/lib/conversation/industry.test.ts
```

### Step 3: User Testing Script
1. Give to salesperson with no Meta ads experience
2. Time how long to create first campaign
3. Ask them to explain what their campaign will do
4. Check if they understand the daily summary

### Step 4: Integration Testing
- [ ] Complete conversation → campaign creation
- [ ] Verify Meta API calls are correct
- [ ] Test with minimum budgets
- [ ] Ensure graceful error handling

## 6. Success Criteria

### Functional Requirements
- [ ] Complete campaign created in < 5 minutes
- [ ] No marketing jargon visible to user
- [ ] Campaign launches with one click
- [ ] Daily summaries make sense to non-marketers
- [ ] Works on mobile phones

### Technical Requirements
- [ ] Conversation state persists across refreshes
- [ ] Messages appear instantly (< 100ms)
- [ ] API responses stream in real-time
- [ ] Handles Meta API errors gracefully
- [ ] Supports 100 concurrent conversations

### Performance Requirements
- [ ] Initial load < 1 second
- [ ] Message response < 2 seconds
- [ ] Campaign creation < 10 seconds
- [ ] 99% uptime for chat interface

## 7. Anti-Patterns to Avoid

### Common Mistakes
- ❌ Showing any Meta Ads jargon (CTR, CPM, etc.)
- ❌ Requiring multiple form fields
- ❌ Making users choose complex targeting
- ❌ Showing advanced options in MVP
- ❌ Using marketing terminology

### Design Mistakes
- ❌ Small text input on mobile
- ❌ Long paragraphs of explanation
- ❌ Multiple steps on one screen
- ❌ Unclear progress indication
- ❌ No way to go back/correct

## 8. Rollback Plan

If issues arise:
1. Feature flag to show old dashboard
2. Save all conversation data for debugging
3. Revert to form-based creation
4. Contact affected users personally

## 9. Post-Launch Iterations

Week 1-2: Core conversation flow
Week 3-4: Industry templates
Week 5-6: Performance translations
Week 7-8: Mobile optimizations
Week 9-10: Advanced features (A/B tests)

---

**Remember**: Every word must be understandable by someone who has never run an ad before. When in doubt, use simpler language.