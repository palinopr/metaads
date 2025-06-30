require('dotenv').config({ path: '.env.local' });
const https = require('https');

const APP_ID = process.env.FACEBOOK_APP_ID || '1349075236218599';
const APP_SECRET = process.env.FACEBOOK_APP_SECRET;

console.log('🔍 CHECKING FACEBOOK LOGIN PRODUCT STATUS\n');

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function checkLoginProduct() {
  try {
    // Get app token
    const tokenUrl = `https://graph.facebook.com/oauth/access_token?client_id=${APP_ID}&client_secret=${APP_SECRET}&grant_type=client_credentials`;
    const tokenData = await makeRequest(tokenUrl);
    const accessToken = tokenData.access_token;

    // Check app products
    console.log('1️⃣ Checking App Products...');
    const productsUrl = `https://graph.facebook.com/v18.0/${APP_ID}/products?access_token=${accessToken}`;
    const products = await makeRequest(productsUrl);
    console.log('Installed Products:', JSON.stringify(products, null, 2));

    // Check app settings
    console.log('\n2️⃣ Checking App Settings...');
    const settingsUrl = `https://graph.facebook.com/v18.0/${APP_ID}/settings?access_token=${accessToken}`;
    const settings = await makeRequest(settingsUrl);
    console.log('App Settings:', JSON.stringify(settings, null, 2));

    // Check OAuth redirect settings
    console.log('\n3️⃣ Testing OAuth Dialog directly...');
    const testOAuthUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${APP_ID}&redirect_uri=https://metaads-web.vercel.app/api/auth/callback/facebook&response_type=code&scope=email,public_profile`;
    console.log('Test this URL in browser:', testOAuthUrl);

    // Check login settings specifically
    console.log('\n4️⃣ Checking Facebook Login Settings...');
    const loginSettingsUrl = `https://graph.facebook.com/v18.0/${APP_ID}?fields=login_secret,allowed_domains,app_domains&access_token=${accessToken}`;
    const loginSettings = await makeRequest(loginSettingsUrl);
    console.log('Login Settings:', JSON.stringify(loginSettings, null, 2));

  } catch (error) {
    console.error('Error:', error);
  }
}

checkLoginProduct();