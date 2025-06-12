/**
 * Test script for Enhanced Meta API Route
 * 
 * This script demonstrates the new comprehensive metrics functionality
 * added to the Meta API route handler.
 */

// Example request payloads for testing the enhanced Meta API

const testRequests = {
  // Test demographics breakdown
  demographics: {
    type: "demographics",
    campaignId: "123456789",
    accessToken: "your_access_token_here",
    datePreset: "last_30d"
  },

  // Test hourly analysis
  hourlyAnalysis: {
    type: "hourly_analysis", 
    campaignId: "123456789",
    accessToken: "your_access_token_here",
    datePreset: "last_7d",
    fields: "spend,impressions,clicks,ctr,actions,action_values"
  },

  // Test device breakdown
  deviceBreakdown: {
    type: "device_breakdown",
    campaignId: "123456789", 
    accessToken: "your_access_token_here",
    datePreset: "last_30d"
  },

  // Test placement analysis
  placementAnalysis: {
    type: "placement_analysis",
    campaignId: "123456789",
    accessToken: "your_access_token_here", 
    datePreset: "last_30d"
  },

  // Test comprehensive metrics (combines all breakdowns)
  comprehensiveMetrics: {
    type: "comprehensive_metrics",
    campaignId: "123456789",
    accessToken: "your_access_token_here",
    datePreset: "last_30d",
    fields: "spend,impressions,clicks,actions,action_values,reach,frequency"
  },

  // Test custom breakdown (backward compatible)
  customBreakdown: {
    type: "insights",
    campaignId: "123456789",
    accessToken: "your_access_token_here",
    breakdown: "age,gender",
    fields: "spend,impressions,clicks,actions,action_values",
    datePreset: "last_30d"
  },

  // Test existing functionality (backward compatibility)
  existingCampaignDetails: {
    type: "campaign_details",
    campaignId: "123456789",
    accessToken: "your_access_token_here",
    adAccountId: "act_123456789",
    datePreset: "last_30d"
  }
};

// Function to test API endpoint
async function testEndpoint(name, payload) {
  console.log(`\n=== Testing ${name} ===`);
  console.log('Request payload:', JSON.stringify(payload, null, 2));
  
  try {
    const response = await fetch('http://localhost:3000/api/meta', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Response structure:', Object.keys(result));
    
    if (result.success) {
      console.log('✅ Success');
      
      // Log specific data structure based on type
      switch (payload.type) {
        case 'demographics':
          console.log('Demographics data keys:', Object.keys(result.demographics || {}));
          break;
        case 'hourly_analysis':
          console.log('Hourly data count:', result.hourlyData?.length || 0);
          break;
        case 'device_breakdown':
          console.log('Device data count:', result.devices?.length || 0);
          break;
        case 'placement_analysis':
          console.log('Placement data count:', result.placements?.length || 0);
          break;
        case 'comprehensive_metrics':
          console.log('Comprehensive data keys:', Object.keys(result.comprehensive || {}));
          break;
        case 'insights':
          console.log('Custom breakdown data count:', result.data?.length || 0);
          break;
        default:
          console.log('Result keys:', Object.keys(result));
      }
    } else {
      console.log('❌ Error:', result.error);
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

// Main test function
async function runTests() {
  console.log('Enhanced Meta API Route Test Suite');
  console.log('====================================');
  console.log('Note: Replace access tokens and campaign IDs with real values to test');
  
  // Test each endpoint
  for (const [name, payload] of Object.entries(testRequests)) {
    await testEndpoint(name, payload);
    // Add delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n=== Test Summary ===');
  console.log('All endpoint tests completed.');
  console.log('Replace placeholder values with real Meta API credentials to perform actual tests.');
}

// Export for use in other test files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testRequests, testEndpoint, runTests };
}

// Run tests if script is executed directly
if (require.main === module) {
  runTests();
}