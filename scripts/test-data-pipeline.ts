// Test script for the enhanced data pipeline
import { MetaAPIEnhancedV2 } from '../lib/meta-api-enhanced-v2'

async function testDataPipeline() {
  console.log('🚀 Testing Meta Ads Data Pipeline...\n')
  
  // Test configuration - these would come from environment or user input
  const config = {
    accessToken: process.env.META_ACCESS_TOKEN || 'YOUR_ACCESS_TOKEN',
    adAccountId: process.env.META_AD_ACCOUNT_ID || 'act_YOUR_ACCOUNT_ID',
    debug: true,
    cacheEnabled: true,
    cacheTTL: 5 * 60 * 1000,
    rateLimitTier: 'standard' as const,
    batchingEnabled: true,
    validationEnabled: true
  }
  
  if (config.accessToken === 'YOUR_ACCESS_TOKEN') {
    console.error('❌ Please set META_ACCESS_TOKEN and META_AD_ACCOUNT_ID environment variables')
    return
  }
  
  const client = new MetaAPIEnhancedV2(config)
  
  try {
    // Test 1: Basic connection
    console.log('📡 Test 1: Testing connection...')
    const connectionTest = await client.testConnection()
    console.log('✅ Connection test:', connectionTest)
    console.log('')
    
    // Test 2: Get campaigns with caching
    console.log('📊 Test 2: Fetching campaigns (should hit API)...')
    const startTime1 = Date.now()
    const campaigns1 = await client.getCampaignsEnhanced('last_7d')
    const time1 = Date.now() - startTime1
    console.log(`✅ Fetched ${campaigns1.length} campaigns in ${time1}ms`)
    
    // Test 3: Get campaigns again (should hit cache)
    console.log('💾 Test 3: Fetching campaigns again (should hit cache)...')
    const startTime2 = Date.now()
    const campaigns2 = await client.getCampaignsEnhanced('last_7d')
    const time2 = Date.now() - startTime2
    console.log(`✅ Fetched ${campaigns2.length} campaigns in ${time2}ms (${Math.round(time1/time2)}x faster)`)
    console.log('')
    
    // Test 4: Pipeline statistics
    console.log('📈 Test 4: Pipeline Statistics')
    const stats = client.getPipelineStats()
    console.log('Cache Hit Rate:', `${(stats.cacheHitRate * 100).toFixed(2)}%`)
    console.log('API Calls Saved:', stats.apiCallsSaved)
    console.log('Rate Limit Usage:', `${stats.rateLimitStatus.currentUsage}/${stats.rateLimitStatus.maxAllowed}`)
    console.log('Validation Errors:', stats.validationErrors)
    console.log('')
    
    // Test 5: Batch operations
    if (campaigns1.length > 0) {
      console.log('🔄 Test 5: Batch fetch campaigns...')
      const campaignIds = campaigns1.slice(0, 3).map(c => c.id)
      const batchResults = await client.batchFetchCampaigns(campaignIds, 'last_7d')
      console.log(`✅ Batch fetched ${batchResults.size} campaigns`)
      console.log('Batch Efficiency:', `${(stats.batchEfficiency * 100).toFixed(2)}%`)
      console.log('')
      
      // Test 6: Data consistency check
      console.log('🔍 Test 6: Data consistency check...')
      const consistencyCheck = await client.performConsistencyCheck(campaignIds)
      console.log('Consistency:', consistencyCheck.consistent ? '✅ All good!' : '⚠️  Issues found')
      if (consistencyCheck.issues.length > 0) {
        console.log('Issues:')
        consistencyCheck.issues.forEach(issue => {
          console.log(`  - [${issue.severity}] Campaign ${issue.campaignId}: ${issue.issue}`)
        })
      }
      console.log('')
      
      // Test 7: Real-time sync
      console.log('🔄 Test 7: Real-time data sync...')
      const syncResult = await client.syncCampaignData(campaignIds[0])
      console.log('Campaign:', syncResult.data.name)
      console.log('Has Changes:', syncResult.hasChanges)
      console.log('Current ROAS:', syncResult.data.roas.toFixed(2))
      console.log('')
    }
    
    // Test 8: Export functionality
    console.log('💾 Test 8: Export data...')
    if (campaigns1.length > 0) {
      const exportIds = campaigns1.slice(0, 2).map(c => c.id)
      const jsonExport = await client.exportCampaignData(exportIds, 'json')
      const csvExport = await client.exportCampaignData(exportIds, 'csv')
      console.log('JSON export size:', `${(jsonExport.length / 1024).toFixed(2)} KB`)
      console.log('CSV export lines:', csvExport.split('\n').length)
    }
    console.log('')
    
    // Test 9: Historical data
    if (campaigns1.length > 0) {
      console.log('📅 Test 9: Historical data fetch...')
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 7)
      
      const historicalData = await client.getHistoricalDataRange(
        campaigns1[0].id,
        startDate,
        endDate,
        'daily'
      )
      console.log(`✅ Fetched ${historicalData.length} days of historical data`)
    }
    
    // Summary
    console.log('\n📊 Pipeline Performance Summary:')
    const finalStats = client.getPipelineStats()
    console.log('Total API calls saved:', finalStats.apiCallsSaved)
    console.log('Cache efficiency:', `${(finalStats.cacheHitRate * 100).toFixed(2)}%`)
    console.log('Rate limit remaining:', `${finalStats.rateLimitStatus.maxAllowed - finalStats.rateLimitStatus.currentUsage} requests`)
    
  } catch (error) {
    console.error('❌ Error during testing:', error)
  } finally {
    // Cleanup
    client.destroy()
    console.log('\n✅ Test completed!')
  }
}

// Run the test
testDataPipeline().catch(console.error)