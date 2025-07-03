# Product Requirements Prompt (PRP) - Fix Meta Account ID Synchronization

## 1. Goal / Why / What

### Goal
Fix the mismatch between internal UUID account IDs and Meta's numeric account IDs to enable proper campaign synchronization and all Meta API operations.

### Why
Currently, the application confuses internal UUIDs with Meta account IDs, causing API calls to fail. This blocks all core functionality including campaign sync, creation, and analytics.

### What
- Ensure consistent ID usage: UUIDs for internal relationships, Meta IDs for API calls
- Fix all API endpoints to use correct account ID format
- Migrate existing data to correct format
- Add validation to prevent future mismatches

## 2. All Needed Context

### Documentation to Read
- [ ] Meta Marketing API: /marketing-api/reference/ad-account (account ID format)
- [ ] Next.js 15 App Router: /docs/app/building-your-application/routing/route-handlers
- [ ] Project Docs: requirements/REQUIREMENTS_SPEC.md#meta-integration
- [ ] Database Schema: src/db/schema/metaAdAccounts.ts

### Examples to Reference
- [ ] Account sync: `src/app/api/connections/meta/accounts/route.ts`
- [ ] Campaign sync: `src/app/api/campaigns/route.ts` 
- [ ] Account selection: `src/app/api/connections/meta/accounts/select/route.ts`
- [ ] Database queries: `src/lib/queries/meta-accounts.ts`

### Known Constraints & Gotchas
- Meta account IDs must be numeric strings (e.g., "123456789")
- Meta API requires `act_` prefix (e.g., "act_123456789")
- Database stores without prefix, API calls add it
- Some accounts may have incorrect IDs from previous bugs
- Must maintain backward compatibility during migration

## 3. Implementation Blueprint

### Data Models
```typescript
// Clarify the account ID types
interface MetaAdAccount {
  id: string              // Internal UUID for relationships
  accountId: string       // Meta's numeric account ID (no act_ prefix)
  accountName: string
  // ... other fields
}

// Helper type for clarity
type MetaAccountId = string    // Numeric string without act_ prefix
type InternalAccountId = string // UUID
```

### Database Changes
```sql
-- Add migration to ensure all account IDs are in correct format
-- Remove any act_ prefixes that might have been stored
UPDATE meta_ad_accounts 
SET account_id = REPLACE(account_id, 'act_', '')
WHERE account_id LIKE 'act_%';

-- Add check constraint to ensure numeric format
ALTER TABLE meta_ad_accounts 
ADD CONSTRAINT check_account_id_numeric 
CHECK (account_id ~ '^\d+$');
```

### Task List
1. [ ] Create helper functions for ID handling
   - [ ] `formatMetaAccountId(id: string): string` - Ensures act_ prefix for API
   - [ ] `parseMetaAccountId(id: string): string` - Removes act_ prefix for storage
   - [ ] `isValidMetaAccountId(id: string): boolean` - Validates numeric format

2. [ ] Fix account storage flow
   - [ ] Update `/api/connections/meta/accounts/route.ts` to validate IDs
   - [ ] Ensure consistent ID storage without act_ prefix
   - [ ] Add logging for ID transformations

3. [ ] Fix account selection
   - [ ] Update `/api/connections/meta/accounts/select/route.ts`
   - [ ] Only accept internal UUID for selection
   - [ ] Return both IDs in response for clarity

4. [ ] Fix all API endpoints
   - [ ] Update campaign sync to use Meta account ID
   - [ ] Fix insights endpoints
   - [ ] Fix ad set endpoints
   - [ ] Update all Meta API calls to use formatMetaAccountId

5. [ ] Update frontend
   - [ ] Show Meta account ID in UI for transparency
   - [ ] Use internal UUID for selections
   - [ ] Add account ID to debug views

6. [ ] Migration and cleanup
   - [ ] Create migration script for existing data
   - [ ] Add validation to prevent future issues
   - [ ] Update error messages for clarity

### Pseudocode / Key Logic
```typescript
// Helper functions in lib/meta/account-utils.ts
export function formatMetaAccountId(accountId: string): string {
  // Remove any existing act_ prefix and re-add it
  const numericId = accountId.replace(/^act_/, '')
  return `act_${numericId}`
}

export function parseMetaAccountId(accountId: string): string {
  // Remove act_ prefix for storage
  return accountId.replace(/^act_/, '')
}

export function isValidMetaAccountId(accountId: string): boolean {
  // Must be numeric string (after removing act_ if present)
  const numericId = parseMetaAccountId(accountId)
  return /^\d+$/.test(numericId)
}

// Updated campaign sync
async function syncCampaigns(internalAccountId: string) {
  // 1. Get account by internal UUID
  const account = await getAccountById(internalAccountId)
  if (!account) throw new Error('Account not found')
  
  // 2. Validate Meta account ID
  if (!isValidMetaAccountId(account.accountId)) {
    throw new Error('Invalid Meta account ID format')
  }
  
  // 3. Format for API call
  const metaAccountId = formatMetaAccountId(account.accountId)
  
  // 4. Make API call
  const url = `https://graph.facebook.com/v18.0/${metaAccountId}/campaigns`
  // ... rest of API call
}
```

## 4. Integration Points

### API Routes to Update
- `GET /api/campaigns` - Use correct account ID for sync
- `POST /api/connections/meta/accounts/select` - Accept only UUID
- `GET /api/connections/meta/selected-account` - Return both IDs
- All campaign-related endpoints - Use Meta ID for API calls

### Database Queries to Update
- `getSelectedMetaAccount` - Ensure returns both IDs
- `getMetaAccountById` - Add ID format validation
- Campaign queries - Join correctly using internal UUID

### External Services
- Meta Marketing API: Always use act_ prefixed IDs
- Internal services: Always use UUID for relationships

### Frontend Routes
- `/dashboard/connections/meta/accounts` - Show Meta ID for clarity
- `/dashboard/campaigns` - Use correct ID for operations
- `/dashboard/debug` - Display both IDs for debugging

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
```typescript
// Test ID formatting functions
describe('Meta Account ID Utils', () => {
  test('formatMetaAccountId adds act_ prefix', () => {
    expect(formatMetaAccountId('123456')).toBe('act_123456')
    expect(formatMetaAccountId('act_123456')).toBe('act_123456')
  })
  
  test('parseMetaAccountId removes act_ prefix', () => {
    expect(parseMetaAccountId('act_123456')).toBe('123456')
    expect(parseMetaAccountId('123456')).toBe('123456')
  })
  
  test('isValidMetaAccountId validates format', () => {
    expect(isValidMetaAccountId('123456')).toBe(true)
    expect(isValidMetaAccountId('act_123456')).toBe(true)
    expect(isValidMetaAccountId('invalid-id')).toBe(false)
    expect(isValidMetaAccountId('abc123')).toBe(false)
  })
})
```

### Step 4: Integration Testing
- [ ] Connect a Meta account and verify correct ID storage
- [ ] Select an account and verify UUID usage
- [ ] Sync campaigns and verify API calls use act_ format
- [ ] Create a campaign and verify it uses correct account ID
- [ ] Check all API endpoints return expected data

### Step 5: Migration Testing
- [ ] Run migration on test database
- [ ] Verify all account IDs updated correctly
- [ ] Test with accounts that had act_ prefix
- [ ] Ensure no data loss or corruption

## 6. Success Criteria

### Functional Requirements
- [ ] All Meta API calls succeed with correct account IDs
- [ ] Campaign sync works for all connected accounts
- [ ] Account selection uses internal UUIDs consistently
- [ ] No "Invalid account ID" errors in logs
- [ ] Migration fixes all existing data

### Technical Requirements
- [ ] No TypeScript errors related to ID types
- [ ] All tests passing
- [ ] Build successful
- [ ] No console errors about account IDs
- [ ] Clear distinction between internal and Meta IDs

### Performance Requirements
- [ ] No degradation in API response times
- [ ] Migration completes in < 1 second
- [ ] ID validation adds < 1ms overhead

## 7. Anti-Patterns to Avoid

### Common Mistakes
- ❌ Using internal UUID as Meta account ID
- ❌ Storing act_ prefix in database
- ❌ Not validating ID format before API calls
- ❌ Mixing up which ID to use where
- ❌ Forgetting to handle existing bad data

### MetaAds-Specific
- ❌ Accepting both ID types in selection endpoints
- ❌ Not logging ID transformations for debugging
- ❌ Breaking existing account connections
- ❌ Not showing Meta account ID in UI
- ❌ Assuming all stored IDs are correct format

## 8. Rollback Plan

If issues arise:
1. Revert code changes
2. Keep database migration (IDs are still valid)
3. Add temporary compatibility layer if needed
4. Monitor logs for any API failures
5. Manually fix any problematic accounts

## 9. Documentation Updates

After implementation:
- [ ] Update API documentation with ID format requirements
- [ ] Add troubleshooting guide for account ID issues
- [ ] Document the two ID types and when to use each
- [ ] Update developer onboarding with ID handling
- [ ] Add examples showing correct ID usage

---

**Remember**: This is a critical fix that unblocks all other features. Test thoroughly at each step.