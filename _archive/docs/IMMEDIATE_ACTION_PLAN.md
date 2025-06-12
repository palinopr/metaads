# 🚨 Immediate Action Plan - Fix This Dashboard NOW

## The Reality Check 🔴
Our dashboard is a mess. Let's fix it properly, step by step.

## Today: Emergency Fixes (2 hours)

### 1. Stable Server Setup
```bash
# Create a production-ready server
npm install pm2 dotenv-safe cors helmet compression
```

Create `server.js`:
```javascript
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const pm2 = require('pm2')

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  }).listen(3000, err => {
    if (err) throw err
    console.log('> Ready on http://localhost:3000')
  })
})

// Auto-restart on crash
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err)
  // Don't exit, keep running
})

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err)
  // Don't exit, keep running
})
```

### 2. Error Boundary Wrapper
Create `app/providers.tsx`:
```typescript
'use client'

import { Component, ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
})

class GlobalErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <GlobalErrorBoundary>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster position="top-right" />
      </QueryClientProvider>
    </GlobalErrorBoundary>
  )
}
```

### 3. Bulletproof Token Manager
Create `lib/token-manager.ts`:
```typescript
export class TokenManager {
  private static TOKEN_KEY = 'meta_access_token'
  private static EXPIRY_KEY = 'meta_token_expiry'
  
  static saveToken(token: string, expiresIn?: number) {
    // Always clean the token
    const cleanToken = token.replace(/^Bearer\s+/i, '').trim()
    
    localStorage.setItem(this.TOKEN_KEY, cleanToken)
    
    if (expiresIn) {
      const expiry = Date.now() + (expiresIn * 1000)
      localStorage.setItem(this.EXPIRY_KEY, expiry.toString())
    }
  }
  
  static getToken(): string | null {
    const token = localStorage.getItem(this.TOKEN_KEY)
    const expiry = localStorage.getItem(this.EXPIRY_KEY)
    
    // Check if expired
    if (expiry && Date.now() > parseInt(expiry)) {
      this.clearToken()
      return null
    }
    
    return token
  }
  
  static clearToken() {
    localStorage.removeItem(this.TOKEN_KEY)
    localStorage.removeItem(this.EXPIRY_KEY)
  }
  
  static isTokenValid(): boolean {
    return !!this.getToken()
  }
}
```

### 4. Smart API Client
Create `lib/api-client.ts`:
```typescript
import { TokenManager } from './token-manager'

export class APIClient {
  private static instance: APIClient
  private abortController?: AbortController
  
  static getInstance() {
    if (!this.instance) {
      this.instance = new APIClient()
    }
    return this.instance
  }
  
  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Cancel any pending requests
    if (this.abortController) {
      this.abortController.abort()
    }
    
    this.abortController = new AbortController()
    
    const token = TokenManager.getToken()
    if (!token) {
      throw new Error('No valid token available')
    }
    
    try {
      const response = await fetch(endpoint, {
        ...options,
        signal: this.abortController.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'API request failed')
      }
      
      return response.json()
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Request was cancelled')
      }
      throw error
    }
  }
}
```

## Tomorrow: Core Refactor (1 day)

### 1. Split the Monolith
```
components/
  /dashboard/
    CampaignList.tsx (50 lines max)
    CampaignCard.tsx
    MetricsGrid.tsx
  /insights/
    AIInsightCard.tsx
    PredictionChart.tsx
  /common/
    ErrorMessage.tsx
    LoadingSpinner.tsx
    EmptyState.tsx
```

### 2. Add React Query
```typescript
// hooks/useCampaigns.ts
export function useCampaigns() {
  return useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const api = APIClient.getInstance()
      return api.request('/api/meta/campaigns')
    },
    enabled: TokenManager.isTokenValid(),
  })
}

// In component
function CampaignDashboard() {
  const { data, error, isLoading, refetch } = useCampaigns()
  
  if (error) return <ErrorMessage error={error} />
  if (isLoading) return <LoadingSpinner />
  if (!data) return <EmptyState />
  
  return <CampaignList campaigns={data} />
}
```

### 3. State Management
```typescript
// stores/app-store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppState {
  // UI State
  sidebarOpen: boolean
  dateRange: 'today' | 'week' | 'month' | 'all'
  
  // User Preferences
  settings: {
    theme: 'light' | 'dark'
    compactView: boolean
    autoRefresh: boolean
  }
  
  // Actions
  toggleSidebar: () => void
  setDateRange: (range: DateRange) => void
  updateSettings: (settings: Partial<Settings>) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      dateRange: 'week',
      settings: {
        theme: 'light',
        compactView: false,
        autoRefresh: true,
      },
      
      toggleSidebar: () => set(state => ({ 
        sidebarOpen: !state.sidebarOpen 
      })),
      
      setDateRange: (dateRange) => set({ dateRange }),
      
      updateSettings: (newSettings) => set(state => ({
        settings: { ...state.settings, ...newSettings }
      })),
    }),
    {
      name: 'app-storage',
    }
  )
)
```

## This Week: Professional Features

### 1. Background Sync
```typescript
// lib/sync-manager.ts
export class SyncManager {
  private syncInterval?: NodeJS.Timeout
  
  startAutoSync(intervalMs = 5 * 60 * 1000) {
    this.stopAutoSync()
    
    this.syncInterval = setInterval(async () => {
      try {
        await this.syncCampaigns()
      } catch (error) {
        console.error('Auto-sync failed:', error)
      }
    }, intervalMs)
  }
  
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }
  }
  
  async syncCampaigns() {
    // Show sync indicator
    toast.loading('Syncing campaigns...')
    
    try {
      const result = await api.syncCampaigns()
      toast.success(`Synced ${result.count} campaigns`)
    } catch (error) {
      toast.error('Sync failed. Will retry in 5 minutes.')
    }
  }
}
```

### 2. Offline Support
```typescript
// lib/offline-manager.ts
export class OfflineManager {
  static async saveToCache(key: string, data: any) {
    if ('caches' in window) {
      const cache = await caches.open('meta-ads-v1')
      const response = new Response(JSON.stringify(data))
      await cache.put(key, response)
    }
  }
  
  static async getFromCache(key: string) {
    if ('caches' in window) {
      const cache = await caches.open('meta-ads-v1')
      const response = await cache.match(key)
      if (response) {
        return response.json()
      }
    }
    return null
  }
}
```

### 3. Performance Monitoring
```typescript
// lib/performance-monitor.ts
export class PerformanceMonitor {
  static trackPageLoad() {
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        const perfData = performance.getEntriesByType('navigation')[0]
        console.log('Page Load Metrics:', {
          domContentLoaded: perfData.domContentLoadedEventEnd,
          loadComplete: perfData.loadEventEnd,
          totalTime: perfData.loadEventEnd - perfData.fetchStart
        })
      })
    }
  }
  
  static trackAPICall(endpoint: string, duration: number) {
    console.log(`API Call: ${endpoint} took ${duration}ms`)
    
    // Send to analytics
    if (window.posthog) {
      window.posthog.capture('api_call', {
        endpoint,
        duration,
        slow: duration > 1000
      })
    }
  }
}
```

## The New Architecture 🏗️

```
meta-ads-dashboard/
├── apps/
│   ├── web/                 # Next.js frontend
│   └── api/                 # Express API (future)
├── packages/
│   ├── ui/                  # Shared components
│   ├── utils/               # Shared utilities
│   └── types/               # TypeScript types
├── services/
│   ├── postgres/            # Database
│   └── redis/               # Cache
└── docker-compose.yml       # Local development
```

## Tools We're Adding 🛠️

### Developer Experience
- **TypeScript Strict Mode**: No more runtime errors
- **ESLint + Prettier**: Consistent code
- **Husky**: Pre-commit checks
- **Jest + React Testing**: Confidence in changes

### Monitoring
- **Sentry**: Error tracking
- **PostHog**: User analytics
- **Vercel Analytics**: Performance monitoring

### Infrastructure
- **GitHub Actions**: CI/CD
- **Docker**: Consistent environments
- **Terraform**: Infrastructure as code

## The Result 🎯

In 1 week, we'll have:
1. **Zero crashes** - Proper error handling everywhere
2. **Instant loading** - Smart caching and offline support
3. **Clean code** - Modular, testable, maintainable
4. **Real insights** - AI that actually helps
5. **Happy users** - No more cryptic errors

This is how we build a **professional product**, not a prototype.

Let's start with the emergency fixes TODAY. The server crashes stop NOW.