// Run these commands in your browser console at https://metaads-production.up.railway.app

// 1. Check health status
fetch('/api/health-check')
  .then(r => r.json())
  .then(data => {
    console.log('=== HEALTH CHECK ===');
    console.log('Credentials:', data.checks.credentials);
    console.log('Meta API:', data.checks.metaApi);
    console.log('Basic Fetch:', data.checks.basicFetch);
    console.log('Recommendations:', data.recommendations);
  })
  .catch(err => console.error('Health check failed:', err));

// 2. Test basic fetch capability
fetch('/api/test-fetch')
  .then(r => r.json())
  .then(data => {
    console.log('=== FETCH TEST ===');
    data.tests.forEach(test => {
      console.log(`${test.test}:`, test.success ? 'SUCCESS' : 'FAILED', test.error || '');
    });
  })
  .catch(err => console.error('Fetch test failed:', err));

// 3. Debug Meta API error
fetch('/api/debug-meta-error', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({})
})
  .then(r => r.json())
  .then(data => {
    console.log('=== META API DEBUG ===');
    console.log('Success:', data.success);
    console.log('Error:', data.error || data.fetchError);
    console.log('Debug info:', data.debug);
  })
  .catch(err => console.error('Meta debug failed:', err));

// 4. Check your current credentials
const token = localStorage.getItem('fb_access_token');
const account = localStorage.getItem('fb_selected_account');
console.log('=== LOCAL CREDENTIALS ===');
console.log('Has token:', !!token, 'Length:', token?.length || 0);
console.log('Account ID:', account);

// 5. Test direct Meta API call from browser
if (token && account) {
  fetch(`https://graph.facebook.com/v19.0/${account}?fields=id,name&access_token=${token}`)
    .then(r => r.json())
    .then(data => {
      console.log('=== DIRECT META API TEST ===');
      console.log('Response:', data);
    })
    .catch(err => console.error('Direct API call failed:', err));
}