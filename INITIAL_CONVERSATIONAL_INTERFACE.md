# MetaAds Feature Request - Conversational Campaign Creation Interface

## FEATURE
Replace complex forms with a guided conversation that helps salespeople create their first profitable Meta ad campaign in under 5 minutes through simple Q&A.

## USER STORY
As a salesperson who has never run Facebook ads, I want to create my first campaign by answering simple questions in plain English so that I can start getting leads without learning marketing jargon.

## EXAMPLES
- Similar component: `src/components/ai-lab/ai-lab-interface.tsx` (but simpler)
- Similar API endpoint: `src/app/api/ai/generate/route.ts`
- Similar functionality: ChatGPT-style interface but for ads

## ACCEPTANCE CRITERIA
- [ ] User can create a complete campaign through conversation only
- [ ] No marketing jargon in any questions or responses
- [ ] Campaign launches with optimized settings based on industry
- [ ] Total time from start to launch: under 5 minutes
- [ ] Clear confirmation before spending any money
- [ ] Daily plain-English performance summaries

## DOCUMENTATION
- Meta Marketing API: /marketing-api/reference/ad-campaign#Creating
- Next.js 15: /docs/app/building-your-application/data-fetching/server-actions
- Internal docs: requirements/AI_LAB_REQUIREMENTS.md

## META ADS API REQUIREMENTS
- Required permissions: ads_management, ads_read
- API endpoints needed: 
  - POST /act_{account_id}/campaigns (simplified creation)
  - GET /act_{account_id}/insights (for plain English reports)
- Rate limit considerations: Batch all initial setup in one API call

## UI/UX REQUIREMENTS
- Location in app: Replace current dashboard, make it the home page
- User flow: 
  1. "Hi! What do you sell?" (open text)
  2. "Where are your customers?" (location helper)
  3. "What's your monthly marketing budget?" (slider)
  4. "Here's what I'll create..." (preview)
  5. "Launch Campaign" (one button)
- Mobile responsive: Yes - optimize for phone (salespeople on the go)
- Loading states needed: Yes - with encouraging messages

## DATA REQUIREMENTS
- New database tables: 
  - `conversation_flows` (store chat history)
  - `industry_templates` (pre-built campaign settings)
  - `performance_translations` (jargon to plain English)
- Modifications to existing tables: 
  - Add `conversation_id` to campaigns table
  - Add `simplicity_mode` flag to users
- Data retention policy: Keep conversations for personalization

## AI AGENT INVOLVEMENT
- Agent required: Yes
- Agent type: Conversational Campaign Creation Agent
- Agent capabilities needed:
  - Understand business from natural language
  - Map to optimal campaign settings
  - Explain performance in simple terms
  - Suggest improvements conversationally

## PERFORMANCE REQUIREMENTS
- Expected load: 10-50 conversations/hour initially
- Response time target: < 2 seconds per message
- Real-time updates needed: Yes - typing indicators

## SECURITY CONSIDERATIONS
- Authentication required: Yes
- Authorization rules: Users can only create campaigns for connected accounts
- Data sensitivity: Business information, budgets

## OTHER CONSIDERATIONS
- Must work for users who don't know what CTR, CPC, or CPM mean
- Should feel like texting a helpful friend, not using software
- Celebrate small wins to build confidence
- Never make users feel stupid for not knowing something
- Default to safest options (low budgets, broad targeting)

## SUCCESS METRICS
- 80% of users complete their first campaign
- 90% understand their daily reports
- 50% respond to optimization suggestions
- Average time to first campaign: < 5 minutes
- User feedback: "This was easy!"

---

**Note**: This is the #1 priority feature. Everything else builds on making the first campaign creation experience magical.