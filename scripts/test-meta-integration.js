#!/usr/bin/env node

/**
 * Command-line utility to test Meta Ads integration
 * Usage: node scripts/test-meta-integration.js <access_token> <ad_account_id> [date_preset]
 */

const https = require('https');

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: node test-meta-integration.js <access_token> <ad_account_id> [date_preset]');
  console.error('Example: node test-meta-integration.js YOUR_TOKEN act_123456789 last_30d');
  process.exit(1);
}

const [accessToken, adAccountId, datePreset = 'last_30d'] = args;

// Test configuration
const testData = {
  accessToken,
  adAccountId,
  datePreset
};

// Make request to test endpoint
const postData = JSON.stringify(testData);

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/test-meta-complete',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('🚀 Starting Meta Ads Integration Test...');
console.log(`📊 Testing with account: ${adAccountId}`);
console.log(`📅 Date preset: ${datePreset}`);
console.log('');

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      
      if (result.success && result.report) {
        const report = result.report;
        
        console.log('✅ Test completed successfully!');
        console.log('');
        console.log('📊 Summary:');
        console.log(`   Total Time: ${report.totalTime}ms`);
        console.log(`   Campaigns: ${report.summary.totalCampaigns}`);
        console.log(`   Ad Sets: ${report.summary.totalAdSets}`);
        console.log(`   Total Spend: $${report.summary.totalSpend.toFixed(2)}`);
        console.log(`   Campaigns with data: ${report.summary.campaignsWithData}`);
        console.log(`   Campaigns without data: ${report.summary.campaignsWithoutData}`);
        console.log('');
        
        // Show test steps
        console.log('📋 Test Steps:');
        report.results.forEach((step, index) => {
          const icon = step.status === 'success' ? '✓' : step.status === 'error' ? '✗' : '⚠';
          const statusColor = step.status === 'success' ? '\x1b[32m' : step.status === 'error' ? '\x1b[31m' : '\x1b[33m';
          console.log(`   ${icon} ${step.step} ${statusColor}[${step.status}]\x1b[0m (${step.timing}ms)`);
          console.log(`      ${step.message}`);
        });
        console.log('');
        
        // Show errors if any
        if (report.summary.errors.length > 0) {
          console.log('❌ Errors:');
          report.summary.errors.forEach(error => {
            console.log(`   • ${error}`);
          });
          console.log('');
        }
        
        // Show warnings if any
        if (report.summary.warnings.length > 0) {
          console.log('⚠️  Warnings:');
          report.summary.warnings.forEach(warning => {
            console.log(`   • ${warning}`);
          });
          console.log('');
        }
        
        // Validation status
        console.log('🔐 Validation:');
        console.log(`   Access Token: ${report.accessTokenValid ? '✅ Valid' : '❌ Invalid'}`);
        console.log(`   Ad Account: ${report.adAccountValid ? '✅ Valid' : '❌ Invalid'}`);
        
      } else {
        console.error('❌ Test failed!');
        console.error(`Error: ${result.error || 'Unknown error'}`);
        
        if (result.report) {
          console.error('\n📋 Partial report available:');
          console.error(JSON.stringify(result.report, null, 2));
        }
      }
    } catch (e) {
      console.error('❌ Failed to parse response:', e.message);
      console.error('Raw response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Request failed:', e.message);
  console.error('Make sure the Next.js server is running on http://localhost:3000');
});

// Set timeout
req.setTimeout(30000, () => {
  console.error('❌ Request timeout after 30 seconds');
  req.abort();
});

req.write(postData);
req.end();