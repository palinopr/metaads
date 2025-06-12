import { NextResponse } from 'next/server'

export async function GET() {
  return new NextResponse(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Clear Cache</title>
    </head>
    <body>
      <h1>Clearing Cache...</h1>
      <div id="status"></div>
      <script>
        async function clearAllCaches() {
          const status = document.getElementById('status');
          
          // Clear service worker caches
          if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(
              cacheNames.map(cacheName => {
                console.log('Deleting cache:', cacheName);
                return caches.delete(cacheName);
              })
            );
            status.innerHTML += '<p>✓ Cleared service worker caches</p>';
          }
          
          // Unregister service workers
          if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (let registration of registrations) {
              await registration.unregister();
              console.log('Unregistered service worker');
            }
            status.innerHTML += '<p>✓ Unregistered service workers</p>';
          }
          
          // Clear localStorage
          localStorage.clear();
          status.innerHTML += '<p>✓ Cleared localStorage</p>';
          
          // Clear sessionStorage
          sessionStorage.clear();
          status.innerHTML += '<p>✓ Cleared sessionStorage</p>';
          
          status.innerHTML += '<h2>Cache cleared! Please go back to the dashboard.</h2>';
          status.innerHTML += '<a href="/dashboard">Go to Dashboard</a>';
        }
        
        clearAllCaches();
      </script>
    </body>
    </html>
  `, {
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  })
}