# Terminal Optimization Strategy

## The Problem
When Claude tries to optimize the entire project in the terminal, it makes too many API calls and causes rate limiting errors in the CLI itself.

## Solution: Modular Optimization Approach

### 1. **Work on One Component at a Time**
Instead of optimizing everything at once, focus on specific components:

```bash
# Good - Specific request
"Optimize only the campaign table performance"

# Bad - Too broad
"Optimize the entire dashboard"
```

### 2. **Use Batch Operations**
Group related changes together:

```bash
# Good - Single file with multiple changes
"Update meta-api-client.ts to add caching and error handling"

# Bad - Multiple files at once
"Update all API files"
```

### 3. **Prioritize Critical Issues**
Focus on the most impactful optimizations first:

1. **Performance bottlenecks** (specific components)
2. **Error handling** (one module at a time)
3. **Code splitting** (one route at a time)

### 4. **Use Local Analysis**
Ask for analysis without immediate implementation:

```bash
# Good
"Analyze the performance issues in campaigns tab and suggest fixes"

# Then implement one fix at a time
"Implement the caching solution for campaigns"
```

### 5. **Incremental Updates**
Break large tasks into smaller chunks:

```bash
# Session 1
"Add caching to Meta API calls"

# Session 2 (later)
"Add error boundaries to main components"

# Session 3 (later)
"Implement lazy loading for charts"
```

## Recommended Workflow

### Phase 1: Analysis (Low API usage)
```
1. "Show me the current performance metrics"
2. "List the largest components by size"
3. "Identify the most frequent API calls"
```

### Phase 2: Planning (No API usage)
```
1. "Create an optimization plan for [specific component]"
2. "What's the best caching strategy for campaigns?"
```

### Phase 3: Implementation (Controlled API usage)
```
1. "Implement caching for campaign API calls only"
2. "Add error handling to meta-api-client.ts"
3. "Optimize the campaign table rendering"
```

## Quick Optimization Wins

### 1. **API Response Caching**
Already implemented in `/lib/api-manager.ts`

### 2. **Component Memoization**
Target specific heavy components:
```typescript
// Ask: "Memoize the CampaignTable component"
```

### 3. **Virtual Scrolling**
For large lists:
```typescript
// Ask: "Add virtual scrolling to campaigns table"
```

### 4. **Debounced Searches**
```typescript
// Ask: "Add debouncing to search inputs"
```

### 5. **Progressive Loading**
```typescript
// Ask: "Implement pagination for campaigns"
```

## What to Avoid

❌ "Optimize everything"
❌ "Update all files"
❌ "Refactor the entire codebase"
❌ "Check and fix all components"

## What to Do Instead

✅ "Optimize the campaigns table performance"
✅ "Add caching to Meta API calls"
✅ "Improve the loading state for AI insights"
✅ "Fix the memory leak in dashboard component"

## Emergency Commands

If you hit rate limits:
```bash
# Wait a bit, then continue with smaller tasks
"Just analyze without making changes"
"Create a plan for optimization"
"Show me the code for [component]"
```

## Best Practices for Terminal Sessions

1. **One goal per session**
2. **Specific file targets**
3. **Incremental progress**
4. **Analysis before action**
5. **Local work when possible**

Remember: The terminal has API limits. Work smart, not hard!