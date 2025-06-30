require('dotenv').config({ path: '.env.local' });
const https = require('https');
const querystring = require('querystring');

const APP_ID = process.env.FACEBOOK_APP_ID || '1349075236218599';
const APP_SECRET = process.env.FACEBOOK_APP_SECRET;

console.log('🔬 FACEBOOK DEEP DEBUG - FULL INSPECTION\n');

// Helper function for API calls
function apiCall(endpoint, accessToken) {
  return new Promise((resolve, reject) => {
    const url = `https://graph.facebook.com/v18.0/${endpoint}${endpoint.includes('?') ? '&' : '?'}access_token=${accessToken}`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.error) {
            reject(result.error);
          } else {
            resolve(result);
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// Get app access token
async function getAppToken() {
  const params = querystring.stringify({
    client_id: APP_ID,
    client_secret: APP_SECRET,
    grant_type: 'client_credentials'
  });
  
  return apiCall(`oauth/access_token?${params}`, '');
}

async function debugEverything() {
  try {
    // Step 1: Get App Access Token
    console.log('1️⃣ Getting App Access Token...');
    const tokenData = await getAppToken();
    const accessToken = tokenData.access_token;
    console.log('✅ Token obtained\n');

    // Step 2: Get Complete App Info
    console.log('2️⃣ Getting Complete App Configuration...');
    const appInfo = await apiCall(`${APP_ID}?fields=id,name,namespace,contact_email,creator_uid,daily_active_users,daily_active_users_rank,icon_url,link,monthly_active_users,monthly_active_users_rank,page_tab_default_name,privacy_policy_url,profile_section_url,restrictions,secure_canvas_url,secure_page_tab_url,server_ip_whitelist,social_discovery,subcategory,terms_of_service_url,url_scheme_suffix,user_support_email,user_support_url,website_url,weekly_active_users,canvas_url,page_tab_url,ios_bundle_id,android_key_hash,client_config,migrations,hosting_url,deauth_callback_url,mobile_profile_section_url,app_domains,auth_dialog_data_help_url,auth_dialog_headline,auth_dialog_perms_explanation,description,gdpv4_nux_enabled,category`, accessToken);
    console.log('App Configuration:', JSON.stringify(appInfo, null, 2));

    // Step 3: Check App Features/Products
    console.log('\n3️⃣ Checking Installed Products/Features...');
    try {
      const products = await apiCall(`${APP_ID}/subscribed_domains`, accessToken);
      console.log('Subscribed Domains:', JSON.stringify(products, null, 2));
    } catch (e) {
      console.log('Subscribed domains check failed:', e.message);
    }

    // Step 4: Check App Permissions
    console.log('\n4️⃣ Checking App Permissions Configuration...');
    try {
      const permissions = await apiCall(`${APP_ID}/permissions?status=live`, accessToken);
      console.log('Live Permissions:', JSON.stringify(permissions, null, 2));
      
      const allPermissions = await apiCall(`${APP_ID}/permissions`, accessToken);
      console.log('All Permissions:', JSON.stringify(allPermissions, null, 2));
    } catch (e) {
      console.log('Permissions check failed:', e.message);
    }

    // Step 5: Check App Roles
    console.log('\n5️⃣ Checking App Roles...');
    try {
      const roles = await apiCall(`${APP_ID}/roles`, accessToken);
      console.log('App Roles:', JSON.stringify(roles, null, 2));
    } catch (e) {
      console.log('Roles check failed:', e.message);
    }

    // Step 6: Check OAuth Redirect URIs via debug
    console.log('\n6️⃣ Checking Login Configuration...');
    try {
      // Get app details that might include OAuth settings
      const loginConfig = await apiCall(`${APP_ID}?fields=auth_dialog_data_help_url,auth_dialog_headline,auth_dialog_perms_explanation,deauth_callback_url`, accessToken);
      console.log('Auth Dialog Config:', JSON.stringify(loginConfig, null, 2));
    } catch (e) {
      console.log('Login config check failed:', e.message);
    }

    // Step 7: Test OAuth URL Construction
    console.log('\n7️⃣ Testing OAuth URL Construction...');
    const oauthUrl = `https://www.facebook.com/v18.0/dialog/oauth?` + querystring.stringify({
      client_id: APP_ID,
      redirect_uri: 'https://metaads-web.vercel.app/api/auth/callback/facebook',
      response_type: 'code',
      scope: 'email,public_profile',
      state: 'test123'
    });
    console.log('OAuth URL:', oauthUrl);

    // Step 8: Check App Review Status
    console.log('\n8️⃣ Checking App Review Status...');
    try {
      const reviewStatus = await apiCall(`${APP_ID}/app_review`, accessToken);
      console.log('App Review Status:', JSON.stringify(reviewStatus, null, 2));
    } catch (e) {
      console.log('App review check failed:', e.message);
    }

    // Step 9: Check App Events Configuration
    console.log('\n9️⃣ Checking App Events Configuration...');
    try {
      const appEvents = await apiCall(`${APP_ID}/app_events_config`, accessToken);
      console.log('App Events Config:', JSON.stringify(appEvents, null, 2));
    } catch (e) {
      console.log('App events check failed:', e.message);
    }

    // Step 10: Debug Token
    console.log('\n🔟 Debugging App Access Token...');
    try {
      const debugToken = await apiCall(`debug_token?input_token=${accessToken}`, accessToken);
      console.log('Token Debug Info:', JSON.stringify(debugToken, null, 2));
    } catch (e) {
      console.log('Token debug failed:', e.message);
    }

    // Analysis
    console.log('\n📊 ANALYSIS:');
    console.log('- App ID:', appInfo.id);
    console.log('- App Name:', appInfo.name);
    console.log('- Privacy Policy:', appInfo.privacy_policy_url ? '✅' : '❌');
    console.log('- Terms of Service:', appInfo.terms_of_service_url ? '✅' : '❌');
    console.log('- Website URL:', appInfo.website_url || 'Not set');
    console.log('- App Domains:', appInfo.app_domains || 'Not set');
    
    console.log('\n🔍 DIAGNOSIS:');
    if (!appInfo.privacy_policy_url || !appInfo.terms_of_service_url) {
      console.log('⚠️  Missing required URLs for Facebook Login');
    }

  } catch (error) {
    console.error('\n❌ Fatal Error:', error);
  }
}

// Run the deep debug
debugEverything();