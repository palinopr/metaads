# MetaAds Feature Request - Fix Meta Account ID Synchronization

## FEATURE
Fix the mismatch between internal UUID account IDs and Meta's numeric account IDs to enable proper campaign synchronization and API operations.

## USER STORY
As a MetaAds user, I want my campaigns to sync correctly with Meta so that I can see real-time data and manage campaigns effectively.

## EXAMPLES
- Current broken flow: `src/app/api/campaigns/route.ts` (uses UUID instead of Meta ID)
- Meta connection setup: `src/app/api/meta/connect/route.ts`
- Account selection: `src/app/(app)/accounts/page.tsx`

## ACCEPTANCE CRITERIA
- [ ] Meta numeric account IDs (act_123456) are stored correctly in database
- [ ] Campaign sync uses correct Meta account IDs for API calls
- [ ] All Meta API calls use the proper account ID format
- [ ] Existing campaigns re-sync with correct account IDs
- [ ] Account switcher shows Meta account IDs for clarity

## DOCUMENTATION
- Meta Marketing API: /marketing-api/reference/ad-account
- Meta Account ID format: act_{numeric_id}
- Internal docs: requirements/REQUIREMENTS_SPEC.md#meta-integration

## META ADS API REQUIREMENTS
- Required permissions: ads_management, ads_read
- API endpoints affected: 
  - GET /act_{account_id}/campaigns
  - GET /act_{account_id}/insights
- Rate limit considerations: Standard tier limits apply

## UI/UX REQUIREMENTS
- Location in app: Backend fix, affects all campaign pages
- User flow: Transparent to users, campaigns just work
- Mobile responsive: N/A (backend fix)
- Loading states needed: No new ones

## DATA REQUIREMENTS
- New database tables: None
- Modifications to existing tables: 
  - metaAdAccounts: ensure accountId stores Meta format
  - campaigns: ensure proper foreign key reference
- Data migration: Update existing account IDs to Meta format

## AI AGENT INVOLVEMENT
- Agent required: No
- This is a core infrastructure fix

## PERFORMANCE REQUIREMENTS
- Expected load: All campaign operations
- Response time target: No change from current
- Real-time updates needed: Yes (existing SSE should work)

## SECURITY CONSIDERATIONS
- Authentication required: Yes (existing)
- Authorization rules: No change
- Data sensitivity: Account IDs are not sensitive

## OTHER CONSIDERATIONS
- Need to handle the transition for existing data
- Ensure backward compatibility during migration
- Test with multiple Meta accounts
- Verify all API endpoints use correct format

## SUCCESS METRICS
- 100% of campaigns sync successfully
- Zero API errors related to account ID format
- Campaign creation works end-to-end
- Real-time updates function properly

---

**Note**: This is a critical blocker that must be fixed before any other features can work properly.