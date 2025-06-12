# Browser Cache Clearing Instructions

## Quick Cache Clear Commands

### Universal Quick Fix (All Browsers)
```
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)
```
This performs a hard refresh that bypasses cache.

### Emergency Reset (When Quick Fix Doesn't Work)
1. Clear all browser cache for localhost
2. Restart browser completely
3. Test in incognito/private mode
4. Try different browser if issue persists

---

## Browser-Specific Instructions

### Google Chrome

#### Method 1: Developer Tools (Recommended)
1. **Open Developer Tools**: `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
2. **Right-click Refresh Button** while DevTools is open
3. **Select "Empty Cache and Hard Reload"**

#### Method 2: Manual Cache Clear
1. **Open Settings**: `chrome://settings/`
2. **Privacy and Security** → **Clear browsing data**
3. **Advanced** tab
4. **Time range**: "All time"
5. **Check these items**:
   - [ ] Browsing history
   - [x] Cookies and other site data
   - [x] Cached images and files
   - [x] Site settings
6. **Click "Clear data"**

#### Method 3: Site-Specific Clear
1. **Navigate to localhost:3000**
2. **Click lock icon** in address bar
3. **Site settings**
4. **Clear data** button

#### Method 4: Keyboard Shortcuts
```bash
# Hard refresh (bypasses cache)
Ctrl + Shift + R (Windows)
Cmd + Shift + R (Mac)

# Force reload from server
Ctrl + F5 (Windows)
Cmd + R (Mac)
```

### Firefox

#### Method 1: Developer Tools
1. **Open Developer Tools**: `F12`
2. **Network tab**
3. **Settings gear icon** → **Disable Cache**
4. **Refresh page**

#### Method 2: Manual Cache Clear
1. **Open History**: `Ctrl+Shift+H` (Windows) / `Cmd+Shift+H` (Mac)
2. **Clear Recent History**
3. **Time range**: "Everything"
4. **Details** dropdown:
   - [x] Cache
   - [x] Cookies
   - [x] Site Preferences
5. **Clear Now**

#### Method 3: About Pages
```
about:cache
about:preferences#privacy
```

### Safari (Mac)

#### Method 1: Develop Menu
1. **Enable Develop Menu**: Safari → Preferences → Advanced → "Show Develop menu"
2. **Develop** → **Empty Caches**
3. **Refresh page**

#### Method 2: Manual Clear
1. **Safari** → **Preferences**
2. **Privacy** tab
3. **Manage Website Data**
4. **Remove All** or search for "localhost"

#### Method 3: Keyboard Shortcuts
```bash
# Hard refresh
Cmd + Shift + R

# Clear cache via Develop menu
Cmd + Option + E
```

### Microsoft Edge

#### Method 1: Developer Tools
1. **Open Developer Tools**: `F12`
2. **Right-click refresh button**
3. **Empty cache and hard reload**

#### Method 2: Settings
1. **Settings**: `edge://settings/`
2. **Privacy, search, and services**
3. **Clear browsing data**
4. **Choose what to clear**:
   - [x] Cached images and files
   - [x] Cookies and site data

---

## Advanced Cache Issues

### When Standard Cache Clear Doesn't Work

#### 1. Service Worker Cache
Service workers can cache resources independently of browser cache.

**Chrome/Edge/Firefox**:
1. **F12** → **Application/Storage** tab
2. **Service Workers** section
3. **Unregister** the service worker
4. **Clear storage** for the site

**Manual Service Worker Clear**:
```javascript
// In browser console
navigator.serviceWorker.getRegistrations().then(function(registrations) {
  for(let registration of registrations) {
    registration.unregister()
  }
})
```

#### 2. Local Storage Clear
Sometimes settings are cached in localStorage.

**Clear localStorage**:
```javascript
// In browser console (F12)
localStorage.clear()
sessionStorage.clear()
```

**Clear specific Meta Ads data**:
```javascript
// Clear only Meta Ads related data
localStorage.removeItem('metaCredentials')
localStorage.removeItem('metaSettings')  
localStorage.removeItem('campaignCache')
Object.keys(localStorage).forEach(key => {
  if (key.startsWith('meta_') || key.startsWith('campaign_')) {
    localStorage.removeItem(key)
  }
})
```

#### 3. IndexedDB Clear
For applications using IndexedDB storage.

**Clear IndexedDB**:
1. **F12** → **Application** tab (Chrome) / **Storage** tab (Firefox)
2. **IndexedDB** section
3. **Delete database** for the site

#### 4. Application Cache (Legacy)
For older web applications.

**Clear Application Cache**:
1. **F12** → **Application** tab
2. **Application Cache** section
3. **Delete** cache entries

---

## Development-Specific Cache Issues

### Next.js Cache Issues

#### 1. Next.js Build Cache
```bash
# Clear Next.js cache on server
rm -rf .next
npm run dev
```

#### 2. Next.js Static Assets
```bash
# Clear static assets cache
rm -rf .next/static
npm run build
```

#### 3. Next.js Service Worker
Next.js applications may register service workers that cache aggressively.

**Check for Service Worker**:
```javascript
// Browser console
navigator.serviceWorker.getRegistrations().then(console.log)
```

### API Cache Issues

#### 1. Meta API Cache
The dashboard may cache API responses.

**Clear API Cache**:
```javascript
// In browser console
fetch('/api/cache', { method: 'DELETE' })
  .then(() => console.log('API cache cleared'))
```

#### 2. Rate Limiting Cache
Rate limiting might be cached client-side.

**Reset Rate Limiting**:
```javascript
// Clear rate limit data
localStorage.removeItem('rateLimitData')
localStorage.removeItem('apiQuota')
```

---

## Automated Cache Clearing

### Browser Extensions for Development

#### 1. Clear Cache Extension (Chrome)
- Install "Clear Cache" extension
- One-click cache clearing
- Customizable clear options

#### 2. Developer Tools Shortcuts
Create custom shortcuts for frequent cache clearing.

**Chrome Custom Shortcuts**:
1. **Chrome Settings** → **Extensions** → **Keyboard shortcuts**
2. **Assign shortcut** to cache clearing extension

### Command Line Cache Clear

#### 1. Chrome Command Line
```bash
# Close Chrome completely first
# Windows
taskkill /F /IM chrome.exe
rmdir /S "%LOCALAPPDATA%\Google\Chrome\User Data\Default\Cache"

# Mac
killall "Google Chrome"
rm -rf ~/Library/Caches/Google/Chrome/Default/Cache

# Linux  
pkill chrome
rm -rf ~/.cache/google-chrome/Default/Cache
```

#### 2. Firefox Command Line
```bash
# Close Firefox first
# Windows
taskkill /F /IM firefox.exe
rmdir /S "%APPDATA%\Mozilla\Firefox\Profiles\*\cache2"

# Mac
killall firefox
rm -rf ~/Library/Caches/Firefox/Profiles/*/cache2

# Linux
pkill firefox
rm -rf ~/.cache/mozilla/firefox/*/cache2
```

---

## Development Workflow Integration

### Pre-Development Cache Clear
```bash
#!/bin/bash
# scripts/clear-dev-cache.sh

echo "🧹 Clearing development caches..."

# Clear Next.js cache
rm -rf .next

# Clear npm cache
npm cache clean --force

# Clear browser cache (Chrome on Mac)
osascript -e 'tell application "Google Chrome" to reload active tab of front window'

echo "✅ Development caches cleared"
```

### Automated Testing Cache Clear
```javascript
// cypress/support/commands.js
Cypress.Commands.add('clearAllCache', () => {
  // Clear localStorage
  cy.clearLocalStorage()
  
  // Clear sessionStorage
  cy.window().then((win) => {
    win.sessionStorage.clear()
  })
  
  // Clear cookies
  cy.clearCookies()
  
  // Clear service workers
  cy.window().then((win) => {
    if ('serviceWorker' in win.navigator) {
      win.navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister()
        })
      })
    }
  })
})
```

---

## Troubleshooting Cache Issues

### Symptoms of Cache Problems

#### 1. Stale Content
- **Symptom**: Old version of dashboard loads
- **Solution**: Hard refresh + clear cache
- **Prevention**: Disable cache during development

#### 2. Settings Not Persisting
- **Symptom**: Credentials don't save between sessions
- **Solution**: Clear localStorage and re-enter
- **Check**: Browser privacy settings

#### 3. API Responses Cached
- **Symptom**: Old data shows despite server updates
- **Solution**: Clear API cache + service worker
- **Check**: Network tab shows "from cache"

#### 4. Styles Not Updating
- **Symptom**: CSS changes don't appear
- **Solution**: Clear cached stylesheets
- **Check**: Disable CSS cache in DevTools

### Diagnostic Commands

#### 1. Check Cache Status
```javascript
// Browser console - check cache sizes
navigator.storage.estimate().then(console.log)

// Check localStorage usage
console.log('localStorage size:', 
  new Blob(Object.values(localStorage)).size)

// Check sessionStorage usage  
console.log('sessionStorage size:',
  new Blob(Object.values(sessionStorage)).size)
```

#### 2. Cache Performance Analysis
```javascript
// Check cache hit rates
performance.getEntriesByType('navigation').forEach(entry => {
  console.log('Cache hit:', entry.transferSize === 0)
})

// Check resource loading times
performance.getEntriesByType('resource').forEach(entry => {
  console.log(entry.name, 'Duration:', entry.duration)
})
```

---

## Best Practices for Development

### 1. Disable Cache During Development
```javascript
// Chrome DevTools
// F12 → Network tab → Settings → Disable cache (while DevTools is open)

// Firefox DevTools  
// F12 → Network tab → Settings → Disable HTTP cache

// Safari DevTools
// Develop → Disable Caches
```

### 2. Use Incognito Mode for Testing
- **Chrome**: `Ctrl+Shift+N` (Windows) / `Cmd+Shift+N` (Mac)
- **Firefox**: `Ctrl+Shift+P` (Windows) / `Cmd+Shift+P` (Mac)  
- **Safari**: `Cmd+Shift+N`

### 3. Cache-Busting Techniques
```javascript
// Add timestamp to API calls
const fetchWithCacheBust = (url) => {
  const cacheBustUrl = `${url}?t=${Date.now()}`
  return fetch(cacheBustUrl)
}

// Add version parameter
const API_VERSION = '1.0.0'
fetch(`/api/meta?v=${API_VERSION}`)
```

### 4. Development Environment Headers
```javascript
// next.config.mjs - disable caching in development
export default {
  async headers() {
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/(.*)',
          headers: [
            { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
            { key: 'Pragma', value: 'no-cache' },
            { key: 'Expires', value: '0' },
          ],
        },
      ]
    }
    return []
  },
}
```

---

## Emergency Cache Recovery

### When Everything Fails

#### 1. Nuclear Option - Fresh Browser Profile
**Chrome**:
```bash
# Create new Chrome profile
chrome --user-data-dir=/path/to/new/profile
```

**Firefox**:
```bash
# Create new Firefox profile
firefox -CreateProfile "test-profile"
firefox -P test-profile
```

#### 2. Different Browser Test
Test in a browser you haven't used for development:
- Chrome → Try Firefox or Safari
- Firefox → Try Chrome or Edge
- Safari → Try Chrome or Firefox

#### 3. Network-Level Cache Clear
```bash
# Flush DNS cache
# Windows
ipconfig /flushdns

# Mac
sudo dscacheutil -flushcache

# Linux  
sudo systemctl restart systemd-resolved
```

---

## Monitoring and Prevention

### 1. Cache Monitoring Script
```javascript
// scripts/monitor-cache.js
setInterval(() => {
  navigator.storage.estimate().then(estimate => {
    const usage = estimate.usage
    const quota = estimate.quota
    const percentUsed = (usage / quota * 100).toFixed(2)
    
    console.log(`Cache usage: ${usage} bytes (${percentUsed}% of quota)`)
    
    if (percentUsed > 80) {
      console.warn('Cache usage high - consider clearing')
    }
  })
}, 60000) // Check every minute
```

### 2. Automatic Cache Management
```javascript
// lib/cache-manager.js
export const manageBrowserCache = () => {
  // Clear cache if it exceeds 50MB
  navigator.storage.estimate().then(estimate => {
    const FIFTY_MB = 50 * 1024 * 1024
    if (estimate.usage > FIFTY_MB) {
      // Clear old cache entries
      const cacheKeys = Object.keys(localStorage)
        .filter(key => key.startsWith('cache_'))
      
      cacheKeys.forEach(key => {
        try {
          const data = JSON.parse(localStorage.getItem(key))
          if (Date.now() - data.timestamp > 24 * 60 * 60 * 1000) {
            localStorage.removeItem(key)
          }
        } catch (e) {
          localStorage.removeItem(key)
        }
      })
    }
  })
}
```

Remember: **When in doubt, clear everything and start fresh** - cache issues can be the most frustrating debugging problems!