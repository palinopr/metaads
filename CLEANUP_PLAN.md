# MetaAds Cleanup & Refactor Plan

## Files to Remove (Debug/Setup)
```bash
# Debug scripts
rm check-setup.js
rm check-users.js
rm diagnose-facebook.js
rm facebook-deep-debug.js
rm facebook-login-check.js
rm fix-facebook-login.js
rm manual-db-setup.js
rm update-db-password.js
rm update-nextauth-url.sh
rm run-migration.sh

# Test scripts
rm test_api_access.py
rm test_openai_integration.py
rm monitor_website.py
rm check_website.py

# Debug documentation
rm AUTH_DEBUG_REPORT.md
rm DEBUG_ADMIN_LOGIN.md
rm DATABASE_URL_FIX.md
rm DEBUGGING_METHODOLOGY.md
rm FACEBOOK_APP_CHECKLIST.md
rm OAUTH_TEST_GUIDE.md
rm SOLUTION.md
rm TROUBLESHOOTING.md
```

## API Routes to Remove
- `/api/test-env/`
- `/api/debug-auth/`
- `/api/debug/`
- `/api/test-db/`
- `/api/debug-meta/`
- `/api/admin/debug/`
- `/api/settings/route.ts` (if not used)

## Components to Refactor
1. **Simplify Auth Flow**
   - Remove complex OAuth debug routes
   - Streamline sign-in page
   - Add simple email/password option for MVP

2. **Enhance Agent Chat**
   - Add streaming responses
   - Implement WebSocket for real-time updates
   - Add quick action buttons

3. **Streamline Campaign Builder**
   - Remove complex multi-step process
   - Make it conversational by default
   - Add "Quick Create" option

## Database Schema Updates
- Keep all existing tables (well-designed)
- Add indexes for performance
- Add `streaming_sessions` table for real-time

## New Features to Add (MVP)
1. **Streaming AI Responses**
2. **Simple Onboarding (3 steps)**
3. **In-app Help Widget**
4. **Quick Actions Menu**

## Keep & Enhance
- ✅ Agent system (add more tools)
- ✅ Campaign management (simplify UI)
- ✅ AI intelligence (add streaming)
- ✅ Database schema (well-designed)
- ✅ Component library (already clean)