require('dotenv').config({ path: '.env.local' });
const https = require('https');

const APP_ID = process.env.FACEBOOK_APP_ID || '1349075236218599';
const APP_SECRET = process.env.FACEBOOK_APP_SECRET;

console.log('🔍 Facebook App Diagnostics\n');
console.log(`App ID: ${APP_ID}`);
console.log(`App Secret: ${APP_SECRET ? '✓ Set' : '✗ Missing'}`);

// Test 1: Get App Access Token
function getAppAccessToken() {
  return new Promise((resolve, reject) => {
    const url = `https://graph.facebook.com/oauth/access_token?client_id=${APP_ID}&client_secret=${APP_SECRET}&grant_type=client_credentials`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.error) {
            reject(result.error);
          } else {
            resolve(result.access_token);
          }
        } catch (e) {
          reject(e);
        }
      });
    });
  });
}

// Test 2: Get App Info
function getAppInfo(accessToken) {
  return new Promise((resolve, reject) => {
    const url = `https://graph.facebook.com/${APP_ID}?access_token=${accessToken}&fields=id,name,namespace,link,app_domains,website_url,privacy_policy_url,terms_of_service_url`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (e) {
          reject(e);
        }
      });
    });
  });
}

// Test 3: Get App Permissions
function getAppPermissions(accessToken) {
  return new Promise((resolve, reject) => {
    const url = `https://graph.facebook.com/${APP_ID}/permissions?access_token=${accessToken}`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (e) {
          reject(e);
        }
      });
    });
  });
}

// Run diagnostics
async function runDiagnostics() {
  try {
    console.log('\n1️⃣ Testing App Access Token...');
    const accessToken = await getAppAccessToken();
    console.log('✅ App Access Token obtained successfully');
    
    console.log('\n2️⃣ Getting App Information...');
    const appInfo = await getAppInfo(accessToken);
    console.log('App Info:', JSON.stringify(appInfo, null, 2));
    
    console.log('\n3️⃣ Checking App Permissions...');
    try {
      const permissions = await getAppPermissions(accessToken);
      console.log('Permissions:', JSON.stringify(permissions, null, 2));
    } catch (e) {
      console.log('Permissions check failed:', e.message || e);
    }
    
    console.log('\n📋 Diagnostic Summary:');
    console.log('- App ID is valid: ✅');
    console.log('- App Secret is valid: ✅');
    console.log(`- App Name: ${appInfo.name || 'Not set'}`);
    console.log(`- App Domains: ${appInfo.app_domains ? appInfo.app_domains.join(', ') : 'None set'}`);
    console.log(`- Privacy Policy: ${appInfo.privacy_policy_url ? '✅' : '❌ Missing'}`);
    console.log(`- Terms of Service: ${appInfo.terms_of_service_url ? '✅' : '❌ Missing'}`);
    
    if (!appInfo.privacy_policy_url || !appInfo.terms_of_service_url) {
      console.log('\n⚠️  WARNING: Missing Privacy Policy or Terms of Service URL');
      console.log('This might cause issues with Facebook Login!');
    }
    
  } catch (error) {
    console.error('\n❌ Diagnostic Failed:', error);
    if (error.message) {
      console.error('Error message:', error.message);
    }
    if (error.type === 'OAuthException') {
      console.error('\n🔧 Fix: Check your App ID and App Secret in .env.local');
    }
  }
}

runDiagnostics();