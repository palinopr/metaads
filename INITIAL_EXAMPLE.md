# MetaAds Feature Request - Bulk Campaign Import

## FEATURE
Allow users to import multiple campaigns at once using a CSV file or by copying campaigns from existing Meta ad accounts.

## USER STORY
As a marketing agency user, I want to bulk import campaigns from CSV files or duplicate campaigns from other accounts so that I can quickly set up multiple campaigns without manual creation.

## EXAMPLES
- Similar component: `src/components/campaigns/campaign-create-form.tsx`
- Similar API endpoint: `src/app/api/campaigns/route.ts` (POST method)
- Similar functionality: Current single campaign creation flow

## ACCEPTANCE CRITERIA
- [ ] Users can upload a CSV file with campaign data
- [ ] System validates CSV format and data before import
- [ ] Users can select campaigns from connected Meta accounts to copy
- [ ] Progress indicator shows import status for each campaign
- [ ] Failed imports are clearly marked with error reasons
- [ ] Users can download a report of successful/failed imports

## DOCUMENTATION
- Meta Marketing API: /marketing-api/reference/ad-campaign#Creating
- Meta Marketing API: /marketing-api/batch-requests
- Next.js 15: /docs/app/building-your-application/routing/route-handlers
- Internal docs: requirements/REQUIREMENTS_SPEC.md#campaign-management

## META ADS API REQUIREMENTS
- Required permissions: ads_management, ads_read
- API endpoints needed: 
  - GET /act_{account_id}/campaigns (to list source campaigns)
  - POST /act_{account_id}/campaigns (batch creation)
- Rate limit considerations: Batch API allows 50 requests per batch, 1000 requests per hour

## UI/UX REQUIREMENTS
- Location in app: New "Import" button on /campaigns page
- User flow: 
  1. Click Import → Choose import method (CSV/Copy)
  2. For CSV: Upload file → Preview → Confirm
  3. For Copy: Select source account → Select campaigns → Configure → Import
- Mobile responsive: Yes (simplified view on mobile)
- Loading states needed: Yes (progress bar for bulk operations)

## DATA REQUIREMENTS
- New database tables: 
  - `import_jobs` (track import status)
  - `import_job_items` (individual campaign import status)
- Modifications to existing tables: None
- Data retention policy: Keep import history for 30 days

## AI AGENT INVOLVEMENT
- Agent required: Yes
- Agent type: Campaign Creation Agent
- Agent capabilities needed:
  - Parse and validate CSV data
  - Suggest optimizations for imported campaigns
  - Auto-fix common formatting issues

## PERFORMANCE REQUIREMENTS
- Expected load: Up to 100 campaigns per import
- Response time target: < 1s to start import, async processing
- Real-time updates needed: Yes - SSE for import progress

## SECURITY CONSIDERATIONS
- Authentication required: Yes
- Authorization rules: Users can only import to accounts they own
- Data sensitivity: Campaign budgets and targeting data

## OTHER CONSIDERATIONS
- CSV format must match Meta's campaign structure
- Handle currency conversions if importing between accounts with different currencies
- Respect account spending limits
- Validate campaign names for uniqueness
- Handle special characters in CSV properly

## SUCCESS METRICS
- Average campaigns imported per user per month
- Import success rate (target: >95%)
- Time saved vs manual creation
- User satisfaction scores

---

**Note**: This example shows a typical feature request for MetaAds. After review, use `/generate-prp` to create the implementation plan.