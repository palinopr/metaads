# Product Requirements Prompt (PRP) - Campaign Automation System

## 1. Goal / Why / What

### Goal
Implement an intelligent campaign automation system that allows users to set rules and triggers for automatic campaign management actions.

### Why
- Reduce manual campaign management overhead
- Improve campaign performance through timely optimizations
- Enable 24/7 campaign monitoring and adjustment
- Provide "set and forget" functionality for advertisers

### What
- Rule-based automation engine
- Pre-built automation templates
- Custom trigger and action system
- Real-time execution with audit logging
- Dashboard for managing automations

## 2. All Needed Context

### Documentation to Read
- [ ] Meta Marketing API: /marketing-api/reference/ad-rule
- [ ] Meta Marketing API: /marketing-api/automated-rules
- [ ] Next.js 15 App Router: /docs/app/building-your-application/data-fetching
- [ ] Project Docs: REQUIREMENTS_SPEC.md sections on AI Intelligence
- [ ] Database Schema: campaigns, ad_sets, ads tables

### Examples to Reference
- [ ] Campaign component: `src/components/campaigns/campaign-list.tsx`
- [ ] API pattern: `src/app/api/campaigns/route.ts`
- [ ] Database query: `src/lib/queries/campaigns.ts`
- [ ] Optimization agent: `src/agents/optimization_agent.py`

### Known Constraints & Gotchas
- Meta API rate limits: 200 calls per hour for automation rules
- OAuth scope requirements: ads_management, ads_read
- Automation rules execute asynchronously on Meta's side
- Maximum 100 rules per ad account
- Rules evaluation happens every 30 minutes on Meta

## 3. Implementation Blueprint

### Data Models
```typescript
// Automation rule model
interface AutomationRule {
  id: string
  userId: string
  accountId: string
  name: string
  description?: string
  enabled: boolean
  trigger: RuleTrigger
  actions: RuleAction[]
  schedule?: RuleSchedule
  createdAt: Date
  updatedAt: Date
  lastExecutedAt?: Date
}

interface RuleTrigger {
  metric: 'ctr' | 'cpc' | 'spend' | 'roas' | 'impressions'
  operator: 'greater_than' | 'less_than' | 'equals'
  value: number
  timeWindow: '1d' | '3d' | '7d' | '14d' | '30d'
}

interface RuleAction {
  type: 'pause' | 'enable' | 'adjust_budget' | 'adjust_bid' | 'notify'
  parameters: Record<string, any>
}
```

### Database Changes
```sql
-- Automation rules table
CREATE TABLE automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  account_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT true,
  trigger JSONB NOT NULL,
  actions JSONB NOT NULL,
  schedule JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_executed_at TIMESTAMP
);

-- Automation execution logs
CREATE TABLE automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES automation_rules(id) ON DELETE CASCADE,
  executed_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(50) NOT NULL,
  affected_entities JSONB,
  error_message TEXT
);

-- Indexes for performance
CREATE INDEX idx_automation_rules_user_id ON automation_rules(user_id);
CREATE INDEX idx_automation_rules_enabled ON automation_rules(enabled);
CREATE INDEX idx_automation_logs_rule_id ON automation_logs(rule_id);
```

### Task List
1. [ ] Database setup
   - [ ] Create schema in `src/db/schema/automation.ts`
   - [ ] Generate migration: `npm run db:generate`
   - [ ] Run migration: `npm run db:migrate`

2. [ ] API Implementation
   - [ ] Create CRUD endpoints in `src/app/api/automations/`
   - [ ] Implement Meta automation rule sync
   - [ ] Add validation middleware
   - [ ] Create execution endpoint

3. [ ] Automation Engine
   - [ ] Create `src/lib/automation/engine.ts`
   - [ ] Implement rule evaluation logic
   - [ ] Add action executors
   - [ ] Create background job for periodic checks

4. [ ] Frontend Components
   - [ ] Create `src/components/automations/automation-builder.tsx`
   - [ ] Build rule configuration UI
   - [ ] Add automation list view
   - [ ] Create execution history component

5. [ ] AI Agent Integration
   - [ ] Extend optimization agent with automation support
   - [ ] Add automation suggestions feature
   - [ ] Implement natural language rule creation

### Pseudocode / Key Logic
```typescript
// Core automation engine
async function evaluateAndExecuteRules(accountId: string) {
  // 1. Fetch enabled rules for account
  const rules = await getEnabledRules(accountId)
  
  // 2. For each rule, evaluate trigger
  for (const rule of rules) {
    const metrics = await fetchMetrics(accountId, rule.trigger)
    
    if (evaluateTrigger(metrics, rule.trigger)) {
      // 3. Execute actions
      for (const action of rule.actions) {
        await executeAction(accountId, action)
      }
      
      // 4. Log execution
      await logExecution(rule.id, 'success', affectedEntities)
    }
  }
}

// Meta API sync
async function syncToMetaAutomation(rule: AutomationRule) {
  const metaRule = {
    name: rule.name,
    evaluation_spec: convertToMetaFormat(rule.trigger),
    execution_spec: convertActionsToMeta(rule.actions),
  }
  
  return await metaAdsApi.createAutomationRule(rule.accountId, metaRule)
}
```

## 4. Integration Points

### API Routes
- `GET /api/automations` - List user's automation rules
- `POST /api/automations` - Create new automation rule
- `PUT /api/automations/[id]` - Update existing rule
- `DELETE /api/automations/[id]` - Delete rule
- `POST /api/automations/[id]/execute` - Manually trigger rule
- `GET /api/automations/[id]/logs` - Get execution history

### Database Queries
- `getAutomationRulesByUserId` - Fetch user's rules
- `createAutomationRule` - Create new rule
- `updateAutomationRule` - Update existing rule
- `getAutomationLogs` - Fetch execution history

### External Services
- Meta Marketing API: /act_{account_id}/adrules_library
- OpenAI: For natural language rule creation
- Background Jobs: Using Vercel Cron or similar

### Frontend Routes
- `/automations` - Main automations dashboard
- `/automations/new` - Create new automation
- `/automations/[id]` - Edit existing automation
- `/automations/[id]/logs` - View execution history

## 5. Validation & Testing

### Step 1: Syntax & Type Checking
```bash
npm run lint
npm run typecheck
```

### Step 2: Build Verification
```bash
npm run build
```

### Step 3: Unit Tests
```bash
# Test rule evaluation logic
npm test -- src/lib/automation/engine.test.ts

# Test API routes
npm test -- src/app/api/automations/route.test.ts
```

### Step 4: Integration Testing
- [ ] Create test automation rule
- [ ] Verify Meta API sync
- [ ] Test rule execution with mock data
- [ ] Validate action execution
- [ ] Check audit logging

### Step 5: Performance Testing
- [ ] Test with 100+ rules per account
- [ ] Verify execution time < 30s
- [ ] Check database query performance
- [ ] Test concurrent rule executions

## 6. Success Criteria

### Functional Requirements
- [ ] Users can create automation rules via UI
- [ ] Rules sync to Meta's automation system
- [ ] Rules execute based on triggers
- [ ] Actions are performed correctly
- [ ] Execution history is logged

### Technical Requirements
- [ ] No TypeScript errors
- [ ] All tests passing
- [ ] Meta API integration working
- [ ] Background jobs executing reliably
- [ ] Proper error handling throughout

### Performance Requirements
- [ ] Rule creation < 2 seconds
- [ ] Rule list loads < 1 second
- [ ] Execution completes < 30 seconds
- [ ] Handles 1000+ rules efficiently

## 7. Anti-Patterns to Avoid

### Common Mistakes
- ❌ Executing rules too frequently (Meta rate limits)
- ❌ Not validating rule logic before saving
- ❌ Missing error handling for Meta API failures
- ❌ Creating infinite loops with conflicting rules
- ❌ Not respecting user's timezone for scheduling

### MetaAds-Specific
- ❌ Bypassing Meta's automation limits
- ❌ Not handling async Meta rule execution
- ❌ Ignoring account-level permissions
- ❌ Creating rules without proper scopes
- ❌ Not providing rule conflict detection

## 8. Rollback Plan

If issues arise:
1. Disable automation engine via feature flag
2. Pause all Meta automation rules via API
3. Revert database schema if needed
4. Clear automation_logs table
5. Notify affected users

## 9. Documentation Updates

After implementation:
- [ ] Add automation guide to user docs
- [ ] Document rule trigger options
- [ ] Create example automation templates
- [ ] Update API documentation
- [ ] Add troubleshooting guide

---

**Remember**: Automation is powerful but dangerous - always prioritize safety and provide clear audit trails.