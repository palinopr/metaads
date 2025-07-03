#!/usr/bin/env node

/**
 * Meta Ads API Permissions Checker
 * Validates OAuth scopes, ad account permissions, and API rate limit status
 */

const { config } = require('dotenv');
const path = require('path');
const https = require('https');

// Load environment variables
config({ path: path.resolve(process.cwd(), '.env') });

// Color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

// Required permissions for MetaAds
const REQUIRED_PERMISSIONS = [
  'ads_management',
  'ads_read',
  'business_management',
  'pages_read_engagement',
  'pages_manage_ads'
];

// Optional but recommended permissions
const OPTIONAL_PERMISSIONS = [
  'pages_manage_metadata',
  'pages_read_user_content',
  'pages_manage_posts',
  'leads_retrieval',
  'catalog_management'
];

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Make HTTPS request to Meta Graph API
 */
function makeMetaApiRequest(path, accessToken) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'graph.facebook.com',
      path: `/v18.0${path}?access_token=${accessToken}`,
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          
          if (res.statusCode === 200) {
            resolve(parsed);
          } else {
            reject(new Error(parsed.error?.message || `API returned status ${res.statusCode}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

/**
 * Debug access token and get permissions
 */
async function debugAccessToken(accessToken) {
  try {
    const debugInfo = await makeMetaApiRequest('/debug_token', accessToken);
    return debugInfo.data;
  } catch (error) {
    throw new Error(`Failed to debug token: ${error.message}`);
  }
}

/**
 * Get user's ad accounts
 */
async function getAdAccounts(accessToken) {
  try {
    const response = await makeMetaApiRequest('/me/adaccounts', accessToken);
    return response.data || [];
  } catch (error) {
    throw new Error(`Failed to get ad accounts: ${error.message}`);
  }
}

/**
 * Check rate limit status
 */
async function checkRateLimit(accessToken) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'graph.facebook.com',
      path: `/v18.0/me?access_token=${accessToken}`,
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      // Extract rate limit headers
      const rateLimit = {
        callCount: res.headers['x-app-usage'] ? JSON.parse(res.headers['x-app-usage']) : null,
        businessUse: res.headers['x-business-use-case-usage'] ? JSON.parse(res.headers['x-business-use-case-usage']) : null,
        adAccountUse: res.headers['x-ad-account-usage'] ? JSON.parse(res.headers['x-ad-account-usage']) : null
      };

      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => { resolve(rateLimit); });
    });

    req.on('error', () => {
      resolve({ error: 'Failed to check rate limits' });
    });

    req.end();
  });
}

/**
 * Main validation function
 */
async function validateMetaPermissions() {
  log('\n🔐 Meta Ads API Permissions Checker\n', 'blue');

  // Check for access token
  const accessToken = process.env.META_ACCESS_TOKEN || process.env.FACEBOOK_ACCESS_TOKEN;
  
  if (!accessToken) {
    log('❌ No Meta access token found in environment variables', 'red');
    log('   Please set META_ACCESS_TOKEN or FACEBOOK_ACCESS_TOKEN', 'yellow');
    process.exit(1);
  }

  if (accessToken.includes('placeholder')) {
    log('⚠️  Access token appears to be a placeholder', 'yellow');
    log('   Please set a valid Meta access token', 'yellow');
    process.exit(1);
  }

  try {
    // Debug token to get permissions
    log('Checking access token...', 'yellow');
    const tokenInfo = await debugAccessToken(accessToken);
    
    log('\n📋 Token Information:', 'blue');
    log(`   App ID: ${tokenInfo.app_id}`);
    log(`   Type: ${tokenInfo.type}`);
    log(`   Valid: ${tokenInfo.is_valid ? 'Yes' : 'No'}`);
    
    if (tokenInfo.expires_at) {
      const expiryDate = new Date(tokenInfo.expires_at * 1000);
      const daysUntilExpiry = Math.floor((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry < 7) {
        log(`   Expires: ${expiryDate.toLocaleDateString()} (⚠️  ${daysUntilExpiry} days)`, 'yellow');
      } else {
        log(`   Expires: ${expiryDate.toLocaleDateString()} (${daysUntilExpiry} days)`, 'green');
      }
    }

    // Check permissions
    const grantedScopes = tokenInfo.scopes || [];
    
    log('\n🔑 Permission Check:', 'blue');
    
    log('\nRequired Permissions:', 'yellow');
    let allRequiredGranted = true;
    REQUIRED_PERMISSIONS.forEach(perm => {
      if (grantedScopes.includes(perm)) {
        log(`   ✅ ${perm}`, 'green');
      } else {
        log(`   ❌ ${perm}`, 'red');
        allRequiredGranted = false;
      }
    });

    log('\nOptional Permissions:', 'yellow');
    OPTIONAL_PERMISSIONS.forEach(perm => {
      if (grantedScopes.includes(perm)) {
        log(`   ✅ ${perm}`, 'green');
      } else {
        log(`   ⚠️  ${perm} (not granted)`, 'yellow');
      }
    });

    // Check ad accounts
    log('\n📊 Ad Account Access:', 'blue');
    try {
      const adAccounts = await getAdAccounts(accessToken);
      
      if (adAccounts.length === 0) {
        log('   ⚠️  No ad accounts found', 'yellow');
      } else {
        log(`   Found ${adAccounts.length} ad account(s):`, 'green');
        adAccounts.slice(0, 5).forEach(account => {
          log(`   - ${account.name} (${account.id})`, 'green');
        });
        if (adAccounts.length > 5) {
          log(`   ... and ${adAccounts.length - 5} more`, 'green');
        }
      }
    } catch (error) {
      log(`   ❌ Failed to retrieve ad accounts: ${error.message}`, 'red');
    }

    // Check rate limits
    log('\n📈 Rate Limit Status:', 'blue');
    const rateLimits = await checkRateLimit(accessToken);
    
    if (rateLimits.error) {
      log(`   ⚠️  Could not check rate limits`, 'yellow');
    } else {
      if (rateLimits.callCount) {
        const usage = Math.max(...Object.values(rateLimits.callCount));
        const color = usage > 75 ? 'red' : usage > 50 ? 'yellow' : 'green';
        log(`   App Usage: ${usage}%`, color);
      }
      
      if (rateLimits.businessUse) {
        Object.entries(rateLimits.businessUse).forEach(([bizId, usage]) => {
          if (usage[0]) {
            const percent = usage[0].estimated_time_to_regain_access ? 100 : usage[0].call_count;
            const color = percent > 75 ? 'red' : percent > 50 ? 'yellow' : 'green';
            log(`   Business ${bizId}: ${percent}%`, color);
          }
        });
      }
    }

    // Summary
    log('\n📋 Summary:', 'blue');
    if (allRequiredGranted) {
      log('   ✅ All required permissions granted', 'green');
      log('   ✅ Token is valid and active', 'green');
      log('\n✨ Meta API configuration is ready!', 'green');
      process.exit(0);
    } else {
      log('   ❌ Missing required permissions', 'red');
      log('   Please re-authenticate with the required scopes', 'yellow');
      process.exit(1);
    }

  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    
    if (error.message.includes('Invalid OAuth access token')) {
      log('\nThe access token is invalid. Please:', 'yellow');
      log('1. Generate a new access token from Facebook Developer Console', 'yellow');
      log('2. Ensure the token has the required permissions', 'yellow');
      log('3. Update your .env file with the new token', 'yellow');
    }
    
    process.exit(1);
  }
}

// Run validation
validateMetaPermissions().catch(error => {
  log(`\n💥 Script error: ${error.message}`, 'red');
  process.exit(1);
});