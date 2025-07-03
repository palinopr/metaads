# MetaAds Feature Request - Dashboard Quick Stats Widget

## FEATURE
Add a Quick Stats widget to the main dashboard that displays key performance metrics (total campaigns, active campaigns, total spend today, and average CTR) in a card layout.

## USER STORY
As a MetaAds user, I want to see my key performance metrics immediately when I log into the dashboard so that I can quickly understand my advertising performance at a glance.

## EXAMPLES
- Similar component: `src/components/dashboard/metrics-card.tsx` (if exists)
- Similar API endpoint: `src/app/api/campaigns/route.ts` (GET method)
- Similar functionality: Campaign list page shows individual campaign metrics

## ACCEPTANCE CRITERIA
- [ ] Widget displays four key metrics: Total Campaigns, Active Campaigns, Today's Spend, Average CTR
- [ ] Metrics update automatically when user navigates to dashboard
- [ ] Loading state shown while fetching data
- [ ] Error state shown if data fetch fails
- [ ] Mobile responsive grid layout

## DOCUMENTATION
- Meta Marketing API: /marketing-api/reference/ad-insights
- Next.js 15: /docs/app/building-your-application/data-fetching/fetching
- Internal docs: Component patterns in examples/component-pattern.tsx

## META ADS API REQUIREMENTS
- Required permissions: ads_read
- API endpoints needed: None (using internal database)
- Rate limit considerations: N/A (internal data)

## UI/UX REQUIREMENTS
- Location in app: Top of /dashboard page
- User flow: Automatic display on dashboard load
- Mobile responsive: Yes (2x2 grid on mobile, 1x4 on desktop)
- Loading states needed: Yes (skeleton cards)

## DATA REQUIREMENTS
- New database tables: None
- Modifications to existing tables: None
- Data retention policy: Use existing campaign data

## AI AGENT INVOLVEMENT
- Agent required: No
- Agent type: N/A
- Agent capabilities needed: N/A

## PERFORMANCE REQUIREMENTS
- Expected load: On every dashboard visit
- Response time target: < 500ms
- Real-time updates needed: No (on page load only)

## SECURITY CONSIDERATIONS
- Authentication required: Yes
- Authorization rules: Users see only their own campaign data
- Data sensitivity: Campaign spend and performance data

## OTHER CONSIDERATIONS
- Use existing shadcn/ui Card components
- Follow existing dashboard design patterns
- Cache results for 1 minute to reduce database load
- Format numbers appropriately (currency for spend, percentage for CTR)

## SUCCESS METRICS
- Dashboard load time remains under 1 second
- Users report improved visibility into campaign performance
- Reduced clicks to access key metrics

---

**Note**: This is a simple feature to demonstrate the context engineering workflow.