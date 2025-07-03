# Execute MetaAds Product Requirements Prompt (PRP)

## Usage
Use this command to execute a PRP document and implement the specified feature.

## Process
1. Read the specified PRP document thoroughly
2. Follow the implementation blueprint step-by-step
3. Run validation commands after each major step
4. Fix any issues before proceeding
5. Complete the final checklist

## Validation Steps
- **Syntax**: Run `npm run lint` and `npm run typecheck`
- **Unit Tests**: Run `npm test` for affected components
- **Integration**: Test with local Meta Ads sandbox
- **Build**: Run `npm run build` to ensure production readiness

## MetaAds-Specific Checks
- Verify database migrations with `npm run db:migrate`
- Check AI agent imports and configurations
- Validate Meta API permissions and scopes
- Test SSE connections for real-time features
- Ensure proper error handling for API rate limits