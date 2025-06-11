// Test script to verify Meta API integration
const testMetaAPI = async () => {
  try {
    console.log('Testing Meta API route...');
    
    // Replace these with your actual values
    const accessToken = 'YOUR_ACCESS_TOKEN';
    const adAccountId = 'act_YOUR_ACCOUNT_ID';
    
    const response = await fetch('http://localhost:3000/api/meta', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'overview',
        datePreset: 'last_30d',
        accessToken: accessToken,
        adAccountId: adAccountId
      })
    });

    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (data.campaigns) {
      console.log('\nCampaigns summary:');
      data.campaigns.forEach(campaign => {
        console.log(`- ${campaign.name}: ${campaign.adsets_count || 0} ad sets, spend: $${campaign.spend || 0}, ROAS: ${campaign.roas || 0}`);
      });
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
};

// Run the test
testMetaAPI();