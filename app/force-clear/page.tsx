'use client'

export default function ForceClear() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Force Clear Cache</h1>
        
        <div className="bg-gray-800 p-6 rounded-lg space-y-4">
          <p>Click the button below to force clear all caches and fix the dashboard:</p>
          
          <button
            onClick={async () => {
              try {
                // 1. Unregister all service workers
                if ('serviceWorker' in navigator) {
                  const registrations = await navigator.serviceWorker.getRegistrations()
                  for (const registration of registrations) {
                    await registration.unregister()
                  }
                  console.log('Unregistered service workers')
                }
                
                // 2. Delete all caches
                if ('caches' in window) {
                  const names = await caches.keys()
                  await Promise.all(names.map(name => caches.delete(name)))
                  console.log('Deleted all caches')
                }
                
                // 3. Clear local storage
                localStorage.clear()
                sessionStorage.clear()
                console.log('Cleared storage')
                
                // 4. Save working credentials
                localStorage.setItem('meta_access_token', 'EAATKZBg465ucBO7LlPXw5pZBVFKX4edsRkiVh9Lm68YUJUMkBR2UUvlbYG4rZCwkbf6mrl2BmJroBgkThXsoqhJwfe1tYkvj8t7O550TOJ56r5AnZBJGuqR0ZApBG02aUflSmg34G9rewZBlqEgBw5l8OW7vDLUUHpBYYpgRCbaZBWrTB0SlFlOZCdxZCrZAYJRUmR6CEBMqKMx3ZAfHDPeA0ec1Td6frnuQD1y')
                localStorage.setItem('meta_ad_account_id', 'act_787610255314938')
                localStorage.setItem('metaCredentialsValidated', 'true')
                console.log('Saved credentials')
                
                alert('Cache cleared! Redirecting to dashboard...')
                
                // 5. Hard reload
                window.location.href = '/dashboard'
              } catch (error) {
                console.error('Error:', error)
                alert('Error: ' + error)
              }
            }}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold"
          >
            Force Clear Everything & Fix Dashboard
          </button>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Manual Steps (if button doesn't work):</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-300">
            <li>Open Chrome DevTools (F12)</li>
            <li>Go to Application tab</li>
            <li>Click "Clear site data" on the left</li>
            <li>Check all boxes and click "Clear"</li>
            <li>Close DevTools and refresh the page</li>
          </ol>
        </div>
      </div>
    </div>
  )
}