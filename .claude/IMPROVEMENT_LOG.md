# Context Improvement Log

This file tracks improvements and discoveries made during development that should be incorporated back into the project's context engineering setup.

## Improvement Guidelines

When working on any task, watch for:
1. **Repeated Patterns** - Document in `examples/`
2. **Better Approaches** - Update existing examples
3. **Common Pitfalls** - Add to CLAUDE.md anti-patterns
4. **Missing Context** - Enhance templates and documentation
5. **Validation Gaps** - Add new validation steps

## Recent Discoveries

### [Date] - [Feature/Task Name]
**Discovery**: [What was found]
**Current Approach**: [How it's currently done]
**Better Approach**: [Improved method]
**Action Taken**: 
- [ ] Updated `examples/[file]`
- [ ] Added to CLAUDE.md
- [ ] Enhanced PRP template
- [ ] Created new example

---

### Example Entry:
### 2025-01-03 - MetaAds Context Setup
**Discovery**: Found that MetaAds uses specific error handling patterns for Meta API
**Current Approach**: Generic error handling
**Better Approach**: Specific Meta API error codes with retry logic
**Action Taken**: 
- [x] Added Meta API error handling to `examples/api-route-pattern.ts`
- [x] Updated CLAUDE.md with Meta API rate limit gotchas
- [ ] Create specific Meta API integration example

## Pending Improvements

1. **SSE Implementation Pattern** - Need to document the Server-Sent Events pattern used for real-time updates
2. **AI Agent Communication** - Document the Python/TypeScript bridge pattern
3. **Campaign State Machine** - Document the campaign status transitions
4. **Batch Operations** - Add examples for bulk Meta API operations

## Context Quality Checklist

Before considering context complete for a feature:
- [ ] All new patterns documented in examples/
- [ ] Gotchas added to CLAUDE.md
- [ ] PRP template updated if new sections needed
- [ ] Validation commands verified and documented
- [ ] Error handling patterns captured
- [ ] Performance considerations noted