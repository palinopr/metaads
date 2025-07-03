# Product Requirements Prompt (PRP) - Real-time Campaign Optimization

## 1. Goal / Why / What

### Goal
Implement an autonomous real-time optimization system that continuously monitors and adjusts Meta Ads campaigns to maximize performance.

### Why
- Campaigns need 24/7 monitoring for optimal performance
- Human reaction time is too slow for rapid market changes
- Automatic optimization can save significant ad spend
- Competitive advantage through instant bid adjustments

### What
- Real-time performance monitoring via webhooks and polling
- AI-driven decision engine for optimization actions
- Automatic bid, budget, and targeting adjustments
- Safety thresholds to prevent runaway spending
- Detailed audit log of all automated actions

## 2. All Needed Context

### Documentation to Read
- [ ] Meta Webhooks: /docs/marketing-api/webhooks/ads-insights
- [ ] Meta Real-time Insights: /docs/marketing-api/insights/real-time
- [ ] Vercel Cron Jobs: /docs/cron-jobs
- [ ] Redis Pub/Sub: https://redis.io/docs/manual/pubsub/
- [ ] Bull Queue: https://docs.bullmq.io/

### Examples to Reference
- [ ] Optimization Agent: `src/agents/optimization.py`
- [ ] Database patterns: `examples/database-pattern.ts`
- [ ] SSE implementation: `examples/sse-pattern.ts`
- [ ] Agent tools: `examples/agent-tool-pattern.py`

### Known Constraints & Gotchas
- Meta webhooks require HTTPS endpoint
- Insights API has 5-minute data delay
- Rate limits: 200 calls/hour per ad account
- Budget changes limited to 4x per day
- Bid changes can cause learning phase reset

## 3. Implementation Blueprint

### Data Models
```typescript
// Optimization rules
interface OptimizationRule {
  id: string
  name: string
  accountId: string
  enabled: boolean
  conditions: RuleCondition[]
  actions: RuleAction[]
  schedule: {
    frequency: 'realtime' | '5min' | '15min' | 'hourly'
    activeHours?: { start: number; end: number }
    timezone: string
  }
  safety: {
    maxDailyChanges: number
    maxBudgetIncrease: number
    requireApproval: boolean
  }
}

interface RuleCondition {
  metric: 'ctr' | 'cpc' | 'cpm' | 'roas' | 'frequency'
  operator: '>' | '<' | '=' | '>=' | '<='
  value: number
  timeframe: '15min' | '1h' | '24h' | '7d'
}

interface OptimizationAction {
  id: string
  ruleId: string
  campaignId: string
  actionType: 'budget' | 'bid' | 'pause' | 'enable' | 'audience'
  previousValue: any
  newValue: any
  reason: string
  impact: {
    estimated: Record<string, number>
    actual?: Record<string, number>
  }
  status: 'pending' | 'applied' | 'reverted' | 'failed'
  appliedAt: Date
}
```

### System Architecture
```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Meta Webhooks  │────▶│  Webhook Handler │────▶│  Redis Queue    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                           │
┌─────────────────┐     ┌──────────────────┐             ▼
│  Cron Jobs      │────▶│  Metrics Fetcher │     ┌─────────────────┐
└─────────────────┘     └──────────────────┘     │  Optimization   │
                                │                 │  Engine         │
                                ▼                 └─────────────────┘
                        ┌──────────────────┐              │
                        │  Time Series DB  │              ▼
                        └──────────────────┘     ┌─────────────────┐
                                                 │  Action Executor │
                                                 └─────────────────┘
```

### Database Changes
```sql
-- Optimization rules (see data models above)
CREATE TABLE optimization_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  account_id VARCHAR(255) NOT NULL,
  enabled BOOLEAN DEFAULT true,
  conditions JSONB NOT NULL,
  actions JSONB NOT NULL,
  schedule JSONB NOT NULL,
  safety JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Optimization actions log
CREATE TABLE optimization_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES optimization_rules(id),
  campaign_id VARCHAR(255) NOT NULL,
  action_type VARCHAR(50) NOT NULL,
  previous_value JSONB,
  new_value JSONB,
  reason TEXT,
  impact JSONB,
  status VARCHAR(20) DEFAULT 'pending',
  applied_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Performance metrics time series
CREATE TABLE campaign_metrics (
  campaign_id VARCHAR(255) NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  impressions INTEGER,
  clicks INTEGER,
  spend DECIMAL(10, 2),
  conversions INTEGER,
  ctr DECIMAL(5, 2),
  cpc DECIMAL(10, 2),
  cpm DECIMAL(10, 2),
  roas DECIMAL(10, 2),
  PRIMARY KEY (campaign_id, timestamp)
);

-- Create hypertable for time series data (if using TimescaleDB)
-- SELECT create_hypertable('campaign_metrics', 'timestamp');
```

### Task List
1. [ ] Infrastructure Setup
   - [ ] Set up Redis for job queue
   - [ ] Configure webhook endpoints
   - [ ] Create cron job handlers
   - [ ] Set up time series database

2. [ ] Data Collection Pipeline
   - [ ] Implement webhook handler for real-time data
   - [ ] Create metrics polling service
   - [ ] Build data aggregation layer
   - [ ] Implement data retention policies

3. [ ] Optimization Engine
   - [ ] Create rule evaluation engine
   - [ ] Build AI decision system
   - [ ] Implement safety checks
   - [ ] Create action execution queue

4. [ ] Monitoring Dashboard
   - [ ] Real-time metrics display
   - [ ] Action history timeline
   - [ ] Rule performance analytics
   - [ ] Alert system for anomalies

5. [ ] Testing & Safety
   - [ ] Create simulation environment
   - [ ] Test with historical data
   - [ ] Implement rollback mechanism
   - [ ] Add manual override controls

### Core Optimization Logic
```python
class OptimizationEngine:
    def __init__(self, ai_model, meta_client):
        self.ai_model = ai_model
        self.meta_client = meta_client
        self.safety_checker = SafetyChecker()
    
    async def evaluate_campaign(self, campaign_id: str, metrics: Dict):
        """Evaluate campaign and determine optimizations"""
        
        # 1. Get applicable rules
        rules = await self.get_active_rules(campaign_id)
        
        # 2. Evaluate each rule
        triggered_actions = []
        for rule in rules:
            if self.evaluate_conditions(rule.conditions, metrics):
                actions = await self.determine_actions(rule, metrics)
                triggered_actions.extend(actions)
        
        # 3. AI enhancement layer
        ai_suggestions = await self.ai_model.suggest_optimizations(
            campaign_id, metrics, triggered_actions
        )
        
        # 4. Combine and prioritize actions
        all_actions = self.prioritize_actions(
            triggered_actions + ai_suggestions
        )
        
        # 5. Safety checks
        safe_actions = self.safety_checker.validate(all_actions)
        
        # 6. Execute actions
        results = []
        for action in safe_actions:
            result = await self.execute_action(action)
            results.append(result)
        
        return results
    
    async def execute_action(self, action: OptimizationAction):
        """Execute optimization action with rollback capability"""
        
        try:
            # Record current state
            current_state = await self.meta_client.get_campaign(
                action.campaign_id
            )
            
            # Apply change
            result = await self.meta_client.update_campaign(
                action.campaign_id,
                action.changes
            )
            
            # Log action
            await self.log_action(action, current_state, result)
            
            # Schedule impact measurement
            await self.schedule_impact_check(action.id, delay='30min')
            
            return result
            
        except Exception as e:
            # Automatic rollback on failure
            await self.rollback_action(action, current_state)
            raise
```

## 4. Integration Points

### Webhook Endpoints
- `POST /api/webhooks/meta/insights` - Real-time performance data
- `POST /api/webhooks/meta/errors` - Campaign errors/issues

### Internal APIs
- `GET /api/optimization/rules` - List optimization rules
- `POST /api/optimization/rules` - Create new rule
- `GET /api/optimization/actions` - Action history
- `POST /api/optimization/simulate` - Test rules without applying

### Background Jobs
```typescript
// Cron job configuration
export const optimizationJobs = {
  // Check campaigns every 5 minutes
  '*/5 * * * *': 'checkCampaignPerformance',
  
  // Hourly deep analysis
  '0 * * * *': 'deepPerformanceAnalysis',
  
  // Daily optimization report
  '0 9 * * *': 'generateOptimizationReport'
}
```

## 5. Validation & Testing

### Step 1: Unit Tests
```bash
# Test rule engine
npm test -- src/lib/optimization/rule-engine.test.ts

# Test safety checks
npm test -- src/lib/optimization/safety.test.ts
```

### Step 2: Simulation Testing
```python
# Test with historical data
python scripts/test-optimization-rules.py \
  --campaign-id=123 \
  --start-date=2024-01-01 \
  --end-date=2024-01-31 \
  --dry-run
```

### Step 3: Integration Testing
- [ ] Test webhook receipt and processing
- [ ] Verify action execution on Meta API
- [ ] Test rollback mechanisms
- [ ] Validate rate limit handling

### Step 4: Safety Testing
- [ ] Test max daily changes limit
- [ ] Verify budget increase caps
- [ ] Test emergency stop functionality
- [ ] Validate approval workflows

## 6. Success Criteria

### Functional Requirements
- [ ] Campaigns optimize automatically based on rules
- [ ] AI provides intelligent suggestions
- [ ] All actions are logged and auditable
- [ ] Safety limits prevent overspending
- [ ] Manual override always available

### Technical Requirements
- [ ] Process webhooks within 1 second
- [ ] Evaluate rules within 5 seconds
- [ ] Execute actions within 10 seconds
- [ ] Handle 1000+ campaigns concurrently
- [ ] 99.9% uptime for critical paths

### Performance Improvements
- [ ] 15%+ improvement in average CTR
- [ ] 10%+ reduction in average CPC
- [ ] 20%+ improvement in ROAS
- [ ] 90% reduction in wasted ad spend

## 7. Anti-Patterns to Avoid

### Common Mistakes
- ❌ Making too many changes too quickly
- ❌ Not considering time zones for scheduling
- ❌ Ignoring Meta's learning phase
- ❌ Not implementing gradual rollouts
- ❌ Missing correlation between campaigns

### MetaAds-Specific
- ❌ Changing budgets more than 4x daily
- ❌ Adjusting bids during peak hours
- ❌ Not respecting account-level limits
- ❌ Ignoring campaign objectives in optimization
- ❌ Not considering creative fatigue

## 8. Rollback Plan

If issues arise:
1. Disable all optimization rules immediately
2. Revert recent changes via stored previous values
3. Pause affected campaigns if necessary
4. Generate incident report with all actions taken
5. Notify affected users via email/SMS

## 9. Monitoring & Alerts

### Key Metrics to Monitor
- Rule trigger frequency
- Action success/failure rate  
- Performance impact of changes
- API rate limit usage
- System response times

### Alert Conditions
- Failed to execute critical optimization
- Unusual spike in rule triggers
- Performance degradation after changes
- Approaching rate limits
- Safety threshold breached

---

**Remember**: Automated optimization can significantly impact ad spend. Always prioritize safety, implement gradual rollouts, and maintain comprehensive audit logs.