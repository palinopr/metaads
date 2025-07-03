# Product Requirements Prompt (PRP) - [FEATURE NAME]

## 1. Goal / Why / What

### Goal
[Clearly state what we're trying to achieve]

### Why
[Business value and user benefits]

### What
[Specific deliverables and success criteria]

## 2. All Needed Context

### Documentation to Read
- [ ] Meta Marketing API: [specific endpoints/sections]
- [ ] Next.js 15 App Router: [specific features]
- [ ] Project Docs: [REQUIREMENTS_SPEC.md sections]
- [ ] Database Schema: [relevant tables]

### Examples to Reference
- [ ] Similar component: `src/components/[component]`
- [ ] API pattern: `src/app/api/[endpoint]/route.ts`
- [ ] Database query: `src/lib/queries/[query].ts`
- [ ] AI agent: `src/agents/[agent].py`

### Known Constraints & Gotchas
- Meta API rate limits: [specifics]
- OAuth scope requirements: [list required scopes]
- Database considerations: [indexes, relations]
- UI/UX requirements: [specific patterns to follow]

## 3. Implementation Blueprint

### Data Models
```typescript
// New or modified types
interface [ModelName] {
  // fields
}
```

### Database Changes
```sql
-- New tables or modifications
CREATE TABLE IF NOT EXISTS [table_name] (
  -- columns
);
```

### Task List
1. [ ] Database setup
   - [ ] Create/modify schema in `src/db/schema/`
   - [ ] Generate migration: `npm run db:generate`
   - [ ] Run migration: `npm run db:migrate`

2. [ ] API Implementation
   - [ ] Create route handler in `src/app/api/`
   - [ ] Implement Meta API integration
   - [ ] Add error handling and rate limiting

3. [ ] Frontend Components
   - [ ] Create/modify components in `src/components/`
   - [ ] Implement loading and error states
   - [ ] Add proper TypeScript types

4. [ ] AI Agent Integration (if applicable)
   - [ ] Create/modify agent in `src/agents/`
   - [ ] Update agent tools and memory
   - [ ] Test with mock data

5. [ ] Testing & Validation
   - [ ] Unit tests for new functions
   - [ ] Integration tests for API routes
   - [ ] Manual testing with Meta sandbox

### Pseudocode / Key Logic
```typescript
// Core implementation logic
async function [mainFunction]() {
  // 1. Validate inputs
  // 2. Check permissions
  // 3. Execute business logic
  // 4. Handle errors
  // 5. Return response
}
```

## 4. Integration Points

### API Routes
- `GET /api/[resource]` - [description]
- `POST /api/[resource]` - [description]

### Database Queries
- `get[Resource]ById` - [description]
- `create[Resource]` - [description]

### External Services
- Meta Marketing API: [endpoints used]
- OpenAI/Anthropic: [if AI features]
- Supabase: [specific features]

### Frontend Routes
- `/[feature]` - Main feature page
- `/[feature]/[id]` - Detail view

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
npm test -- [test-file-pattern]
```

### Step 4: Integration Testing
- [ ] Test with Meta sandbox account
- [ ] Verify database operations
- [ ] Check error handling
- [ ] Validate UI responsiveness

### Step 5: Performance Testing
- [ ] Check API response times
- [ ] Verify SSE connection stability
- [ ] Test with realistic data volumes

## 6. Success Criteria

### Functional Requirements
- [ ] Feature works as specified in INITIAL.md
- [ ] All edge cases handled
- [ ] Proper error messages displayed
- [ ] Data persisted correctly

### Technical Requirements
- [ ] No TypeScript errors
- [ ] All tests passing
- [ ] Build successful
- [ ] No console errors in browser
- [ ] Meta API integration working

### Performance Requirements
- [ ] Page loads under 3 seconds
- [ ] API responses under 500ms
- [ ] No memory leaks
- [ ] Handles concurrent users

## 7. Anti-Patterns to Avoid

### Common Mistakes
- ❌ Hardcoding Meta API credentials
- ❌ Missing error boundaries in components
- ❌ Forgetting to handle rate limits
- ❌ Not validating user permissions
- ❌ Creating components over 300 lines

### MetaAds-Specific
- ❌ Using Pages Router instead of App Router
- ❌ Direct database queries in components
- ❌ Synchronous Meta API calls
- ❌ Missing loading states for async operations
- ❌ Not following existing code patterns

## 8. Rollback Plan

If issues arise:
1. Revert database migrations if needed
2. Disable feature flag (if implemented)
3. Roll back to previous deployment
4. Notify users of temporary unavailability

## 9. Documentation Updates

After implementation:
- [ ] Update API documentation
- [ ] Add feature to user guide
- [ ] Update CHANGELOG.md
- [ ] Add examples to examples/ directory

---

**Remember**: Follow existing patterns, validate continuously, and prioritize user experience and security.