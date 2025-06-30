const { exec } = require('child_process');

console.log('🚨 FACEBOOK LOGIN PRODUCT NOT ENABLED!\n');
console.log('The root cause has been identified: Facebook Login product is not added to your app.\n');

console.log('📋 AUTOMATED FIX INSTRUCTIONS:\n');

console.log('1. Opening Facebook App Dashboard...');
const dashboardUrl = 'https://developers.facebook.com/apps/1349075236218599/add/';

console.log('\n2. When the page loads:');
console.log('   a) Look for "Facebook Login" in the products list');
console.log('   b) Click "Set Up" or "Add Product"');
console.log('   c) Choose "Web"');
console.log('   d) For Site URL, enter: https://metaads-web.vercel.app');
console.log('   e) Click "Save"');

console.log('\n3. Then go to Facebook Login → Settings:');
console.log('   https://developers.facebook.com/apps/1349075236218599/fb-login/settings/');
console.log('   - Ensure "Client OAuth Login" is ON');
console.log('   - Ensure "Web OAuth Login" is ON');
console.log('   - Valid OAuth Redirect URIs should include:');
console.log('     • https://metaads-web.vercel.app/api/auth/callback/facebook');
console.log('     • http://localhost:3000/api/auth/callback/facebook');

console.log('\n4. After enabling Facebook Login, the OAuth will work immediately.');

console.log('\n🔧 ALTERNATIVE: Use a different provider temporarily');
console.log('If you cannot access the dashboard, consider using Google OAuth instead.');

// Try to open the dashboard
console.log('\n🌐 Attempting to open dashboard in your browser...');
try {
  if (process.platform === 'darwin') {
    exec(`open "${dashboardUrl}"`);
  } else if (process.platform === 'win32') {
    exec(`start "${dashboardUrl}"`);
  } else {
    exec(`xdg-open "${dashboardUrl}"`);
  }
} catch (e) {
  console.log('Please manually open:', dashboardUrl);
}

console.log('\n✅ Once Facebook Login is enabled, your app will work!');
console.log('\nNOTE: This is a one-time setup. The Facebook Login product must be added to use OAuth.');