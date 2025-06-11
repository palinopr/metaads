// Test script for Meta API route
async function testMetaAPI() {
  try {
    console.log('Testing Meta API route...');
    
    // You need to replace these with actual values
    const accessToken = 'YOUR_ACCESS_TOKEN';
    const adAccountId = 'act_YOUR_AD_ACCOUNT_ID';
    
    const response = await fetch('http://localhost:3001/api/meta', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'overview',
        adAccountId: adAccountId,
        accessToken: accessToken,
        datePreset: 'last_30d'
      })
    });
    
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (data.campaigns) {
      console.log('\nCampaign Summary:');
      data.campaigns.forEach(campaign => {
        console.log(`- ${campaign.name}: ${campaign.adsets_count} ad sets, spend: $${campaign.spend}, ROAS: ${campaign.roas}`);
      });
    }
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

// Run the test
console.log('Note: Replace accessToken and adAccountId with actual values before running');
console.log('You can get these from your Meta Business Manager');