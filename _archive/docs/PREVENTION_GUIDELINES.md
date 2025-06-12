# Error Prevention Guidelines & Best Practices

## Quick Reference Card

### Before You Code:
```typescript
// 1. Define your types first
interface MyComponentProps {
  required: string
  optional?: number
}

// 2. Plan your imports
import { utilityFunction } from '@/lib/utils'

// 3. Set initial state with proper types
const [data, setData] = useState<DataType | null>(null)
```

### Common Error Fixes:

**Missing Import Error:**
```typescript
// ❌ Wrong
const formatted = formatAdAccountId(id)

// ✅ Correct
import { formatAdAccountId } from '@/lib/meta-api-client'
const formatted = formatAdAccountId(id)
```

**Undefined Property Access:**
```typescript
// ❌ Wrong
const value = data.property.toFixed(2)

// ✅ Correct
const value = (data?.property || 0).toFixed(2)
```

**Token Format Error:**
```typescript
// ❌ Wrong
headers: { 'Authorization': token }

// ✅ Correct
import { formatAccessToken } from '@/lib/meta-api-client'
headers: { 'Authorization': formatAccessToken(token) }
```

## Essential Utility Functions

### 1. Safe Data Access
```typescript
// lib/utils/safe-access.ts
export function safely<T>(fn: () => T, fallback: T): T {
  try {
    return fn() ?? fallback
  } catch {
    return fallback
  }
}

// Usage
const roas = safely(() => campaign.insights.roas, 0)
```

### 2. Validation Helpers
```typescript
// lib/utils/validation.ts
export function isValidCampaign(data: any): data is Campaign {
  return (
    data &&
    typeof data.id === 'string' &&
    typeof data.name === 'string' &&
    typeof data.status === 'string'
  )
}

export function ensureNumber(value: any, fallback = 0): number {
  const num = Number(value)
  return isNaN(num) ? fallback : num
}
```

### 3. API Response Handlers
```typescript
// lib/utils/api-handlers.ts
export function handleApiResponse<T>(
  response: any,
  validator: (data: any) => data is T
): T | null {
  if (!response || !validator(response)) {
    console.error('Invalid API response:', response)
    return null
  }
  return response
}
```

## Component Templates

### Safe Component Template
```typescript
interface ComponentProps {
  // Always define all props
  requiredProp: string
  optionalProp?: number
  onAction: (id: string) => void
}

export function SafeComponent({
  requiredProp,
  optionalProp = 0, // Always provide defaults
  onAction
}: ComponentProps) {
  // Initialize state with proper types
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<DataType | null>(null)
  
  // Safe async operations
  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await api.getData()
      
      // Validate response
      if (response?.data) {
        setData(response.data)
      }
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Safe rendering
  if (loading) return <div>Loading...</div>
  if (!data) return <div>No data</div>
  
  return (
    <div>
      {/* Safe property access */}
      <p>{data?.name || 'Unnamed'}</p>
      <p>{(data?.value || 0).toFixed(2)}</p>
    </div>
  )
}
```

## API Integration Pattern

### Safe API Client Usage
```typescript
// lib/api/safe-client.ts
import { MetaAPIClient, formatAccessToken, formatAdAccountId } from '@/lib/meta-api-client'

export class SafeMetaClient {
  private client: MetaAPIClient
  
  constructor(token: string, accountId: string) {
    // Always format inputs
    const formattedToken = formatAccessToken(token)
    const formattedAccountId = formatAdAccountId(accountId)
    
    this.client = new MetaAPIClient(formattedToken, formattedAccountId)
  }
  
  async getCampaigns() {
    try {
      const campaigns = await this.client.getCampaigns()
      
      // Validate and transform response
      return campaigns.map(campaign => ({
        ...campaign,
        spend: ensureNumber(campaign.insights?.spend),
        roas: ensureNumber(campaign.insights?.roas),
        conversions: ensureNumber(campaign.insights?.conversions)
      }))
    } catch (error) {
      console.error('Failed to fetch campaigns:', error)
      return []
    }
  }
}
```

## State Management Pattern

### Safe State Updates
```typescript
// Define state shape
interface AppState {
  campaigns: Campaign[]
  filters: {
    status: string
    dateRange: string
  }
  ui: {
    loading: boolean
    error: string | null
  }
}

// Initial state with all properties
const initialState: AppState = {
  campaigns: [],
  filters: {
    status: 'all',
    dateRange: 'last_30d'
  },
  ui: {
    loading: false,
    error: null
  }
}

// Safe state updates
function updateState(updates: Partial<AppState>) {
  setState(prev => ({
    ...prev,
    ...updates,
    // Ensure nested objects are properly merged
    filters: {
      ...prev.filters,
      ...(updates.filters || {})
    },
    ui: {
      ...prev.ui,
      ...(updates.ui || {})
    }
  }))
}
```

## Testing Checklist

### Unit Test Template
```typescript
// __tests__/utils.test.ts
import { formatAdAccountId, formatAccessToken } from '@/lib/utils'

describe('Utility Functions', () => {
  describe('formatAdAccountId', () => {
    it('should add act_ prefix if missing', () => {
      expect(formatAdAccountId('123456')).toBe('act_123456')
    })
    
    it('should not duplicate act_ prefix', () => {
      expect(formatAdAccountId('act_123456')).toBe('act_123456')
    })
    
    it('should handle empty string', () => {
      expect(() => formatAdAccountId('')).toThrow()
    })
  })
})
```

## IDE Setup Recommendations

### VS Code Settings
```json
{
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "typescript.suggest.autoImports": true,
  "typescript.updateImportsOnFileMove.enabled": "always",
  "editor.codeActionsOnSave": {
    "source.organizeImports": true,
    "source.fixAll.eslint": true
  }
}
```

### ESLint Configuration
```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}
```

## Daily Development Checklist

### Morning Setup:
- [ ] Pull latest code
- [ ] Run `npm install` to ensure dependencies
- [ ] Run `npm run type-check` to catch type errors
- [ ] Check for any lint warnings

### Before Each Feature:
- [ ] Create type definitions first
- [ ] Plan component structure
- [ ] Identify all dependencies
- [ ] Set up test file

### During Development:
- [ ] Import functions as you use them
- [ ] Add null checks for all external data
- [ ] Test each function in isolation
- [ ] Handle error cases

### Before Committing:
- [ ] Run TypeScript compiler
- [ ] Fix all type errors
- [ ] Remove unused imports
- [ ] Test error scenarios
- [ ] Update documentation

## Emergency Fixes

### Quick Fixes for Common Errors:

**1. "Cannot read property of undefined"**
```typescript
// Add optional chaining
value?.property?.method()

// Or provide fallback
(value || {}).property
```

**2. "X is not defined"**
```typescript
// Check imports at top of file
import { X } from './module'

// Or declare if it's a variable
const X = useX()
```

**3. "Missing required prop"**
```typescript
// Check component usage
<Component 
  requiredProp={value}
  // Add any missing props shown in error
/>
```

**4. Token/API Errors**
```typescript
// Always format tokens
const token = formatAccessToken(rawToken)

// Always validate responses
if (!response || response.error) {
  // Handle error
}
```

## Remember:
1. **Types First**: Always define interfaces before implementation
2. **Import Everything**: Never assume a function is globally available
3. **Validate External Data**: Never trust API responses or user input
4. **Provide Defaults**: Always have fallback values
5. **Test Edge Cases**: Empty arrays, null values, network failures

By following these guidelines, you'll prevent 90% of the common errors we've encountered!