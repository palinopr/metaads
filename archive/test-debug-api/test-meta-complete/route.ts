import { NextRequest, NextResponse } from 'next/server'
import { MetaAPIClient } from '@/lib/meta-api-client'
import { AdSetAndAdAPI } from '@/lib/meta-api-adsets'

interface TestResult {
  step: string
  status: 'success' | 'error' | 'warning'
  message: string
  timing: number
  data?: any
  error?: any
}

interface TestReport {
  timestamp: string
  totalTime: number
  accessTokenValid: boolean
  adAccountValid: boolean
  results: TestResult[]
  summary: {
    totalCampaigns: number
    totalAdSets: number
    totalSpend: number
    campaignsWithData: number
    campaignsWithoutData: number
    errors: string[]
    warnings: string[]
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const results: TestResult[] = []
  const errors: string[] = []
  const warnings: string[] = []
  
  let accessTokenValid = false
  let adAccountValid = false
  let totalCampaigns = 0
  let totalAdSets = 0
  let totalSpend = 0
  let campaignsWithData = 0
  let campaignsWithoutData = 0

  try {
    const { accessToken, adAccountId, datePreset = 'last_30d' } = await request.json()
    
    // Step 1: Validate Access Token Format
    const step1Start = Date.now()
    try {
      if (!accessToken) {
        throw new Error('Access token is required')
      }
      
      // Check if token looks valid (basic validation)
      const cleanToken = accessToken.replace(/^Bearer\s+/i, '').trim()
      if (cleanToken.length < 10) {
        throw new Error('Access token appears to be invalid (too short)')
      }
      
      results.push({
        step: 'Access Token Validation',
        status: 'success',
        message: 'Access token format is valid',
        timing: Date.now() - step1Start,
        data: { tokenLength: cleanToken.length }
      })
      accessTokenValid = true
    } catch (error: any) {
      results.push({
        step: 'Access Token Validation',
        status: 'error',
        message: error.message,
        timing: Date.now() - step1Start,
        error: error.message
      })
      errors.push(`Token validation: ${error.message}`)
    }

    // Step 2: Validate Ad Account ID Format
    const step2Start = Date.now()
    try {
      if (!adAccountId) {
        throw new Error('Ad account ID is required')
      }
      
      const cleanAccountId = adAccountId.trim()
      if (!cleanAccountId.startsWith('act_')) {
        warnings.push('Ad account ID should start with "act_"')
      }
      
      if (!/^\d+$/.test(cleanAccountId.replace('act_', ''))) {
        throw new Error('Ad account ID should contain only numbers after "act_"')
      }
      
      results.push({
        step: 'Ad Account ID Validation',
        status: 'success',
        message: 'Ad account ID format is valid',
        timing: Date.now() - step2Start,
        data: { adAccountId: cleanAccountId }
      })
      adAccountValid = true
    } catch (error: any) {
      results.push({
        step: 'Ad Account ID Validation',
        status: 'error',
        message: error.message,
        timing: Date.now() - step2Start,
        error: error.message
      })
      errors.push(`Account ID validation: ${error.message}`)
    }

    // Step 3: Test Meta API Connection
    const step3Start = Date.now()
    try {
      const testUrl = `https://graph.facebook.com/v19.0/${adAccountId}?fields=id,name,account_status&access_token=${accessToken.replace(/^Bearer\s+/i, '').trim()}`
      
      const testResponse = await fetch(testUrl)
      const testData = await testResponse.json()
      
      if (!testResponse.ok) {
        throw new Error(testData.error?.message || 'Failed to connect to Meta API')
      }
      
      results.push({
        step: 'Meta API Connection Test',
        status: 'success',
        message: `Connected to account: ${testData.name}`,
        timing: Date.now() - step3Start,
        data: {
          accountId: testData.id,
          accountName: testData.name,
          accountStatus: testData.account_status
        }
      })
      
      if (testData.account_status !== 1) {
        warnings.push(`Account status is ${testData.account_status} (not active)`)
      }
    } catch (error: any) {
      results.push({
        step: 'Meta API Connection Test',
        status: 'error',
        message: error.message,
        timing: Date.now() - step3Start,
        error: error.message
      })
      errors.push(`API connection: ${error.message}`)
      
      // Can't continue without valid connection
      throw new Error('Cannot proceed without valid Meta API connection')
    }

    // Step 4: Initialize API Clients
    const step4Start = Date.now()
    let client: MetaAPIClient
    let adSetClient: AdSetAndAdAPI
    
    try {
      client = new MetaAPIClient(accessToken, adAccountId)
      adSetClient = new AdSetAndAdAPI(accessToken, adAccountId)
      
      results.push({
        step: 'API Client Initialization',
        status: 'success',
        message: 'Meta API clients initialized successfully',
        timing: Date.now() - step4Start
      })
    } catch (error: any) {
      results.push({
        step: 'API Client Initialization',
        status: 'error',
        message: error.message,
        timing: Date.now() - step4Start,
        error: error.message
      })
      errors.push(`Client initialization: ${error.message}`)
      throw error
    }

    // Step 5: Fetch Campaigns
    const step5Start = Date.now()
    let campaigns: any[] = []
    
    try {
      console.log(`Fetching campaigns with date preset: ${datePreset}`)
      campaigns = await client.getCampaigns(datePreset)
      totalCampaigns = campaigns.length
      
      results.push({
        step: 'Fetch Campaigns',
        status: 'success',
        message: `Found ${campaigns.length} campaigns`,
        timing: Date.now() - step5Start,
        data: {
          campaignCount: campaigns.length,
          campaigns: campaigns.map(c => ({
            id: c.id,
            name: c.name,
            status: c.status,
            objective: c.objective
          }))
        }
      })
      
      if (campaigns.length === 0) {
        warnings.push('No campaigns found for the selected date range')
      }
    } catch (error: any) {
      results.push({
        step: 'Fetch Campaigns',
        status: 'error',
        message: error.message,
        timing: Date.now() - step5Start,
        error: error.message
      })
      errors.push(`Fetch campaigns: ${error.message}`)
    }

    // Step 6: Fetch Ad Sets and Process Insights
    const step6Start = Date.now()
    const campaignDetails: any[] = []
    
    for (const campaign of campaigns) {
      try {
        console.log(`Processing campaign: ${campaign.name} (${campaign.id})`)
        
        // Process campaign insights
        let campaignSpend = 0
        let hasInsights = false
        
        if (campaign.insights?.data?.[0]) {
          const insights = campaign.insights.data[0]
          campaignSpend = parseFloat(insights.spend || '0')
          hasInsights = true
          totalSpend += campaignSpend
          
          if (campaignSpend > 0) {
            campaignsWithData++
          } else {
            campaignsWithoutData++
          }
        } else {
          campaignsWithoutData++
          warnings.push(`Campaign "${campaign.name}" has no insights data`)
        }
        
        // Fetch ad sets
        let adSets: any[] = []
        try {
          adSets = await adSetClient.getAdSetsForCampaign(campaign.id)
          totalAdSets += adSets.length
        } catch (error: any) {
          warnings.push(`Failed to fetch ad sets for campaign "${campaign.name}": ${error.message}`)
        }
        
        campaignDetails.push({
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          hasInsights,
          spend: campaignSpend,
          adSetCount: adSets.length,
          insights: campaign.insights?.data?.[0] || null,
          adSets: adSets.map(as => ({
            id: as.id,
            name: as.name,
            status: as.status,
            effective_status: as.effective_status
          }))
        })
      } catch (error: any) {
        errors.push(`Campaign "${campaign.name}": ${error.message}`)
      }
    }
    
    results.push({
      step: 'Fetch Ad Sets and Process Insights',
      status: campaignDetails.length > 0 ? 'success' : 'warning',
      message: `Processed ${campaignDetails.length} campaigns with ${totalAdSets} total ad sets`,
      timing: Date.now() - step6Start,
      data: {
        campaignDetails,
        totalAdSets,
        totalSpend
      }
    })

    // Step 7: Validate Data Integrity
    const step7Start = Date.now()
    const dataIssues: string[] = []
    
    // Check for campaigns with spend but no ad sets
    campaignDetails.forEach(campaign => {
      if (campaign.spend > 0 && campaign.adSetCount === 0) {
        dataIssues.push(`Campaign "${campaign.name}" has spend ($${campaign.spend}) but no ad sets`)
      }
    })
    
    // Check for rate limiting indicators
    if (errors.some(e => e.includes('rate limit') || e.includes('too many requests'))) {
      dataIssues.push('Rate limiting detected - some data may be incomplete')
    }
    
    results.push({
      step: 'Data Integrity Validation',
      status: dataIssues.length === 0 ? 'success' : 'warning',
      message: dataIssues.length === 0 ? 'Data integrity checks passed' : `Found ${dataIssues.length} data issues`,
      timing: Date.now() - step7Start,
      data: { issues: dataIssues }
    })
    
    if (dataIssues.length > 0) {
      warnings.push(...dataIssues)
    }

    // Generate test report
    const report: TestReport = {
      timestamp: new Date().toISOString(),
      totalTime: Date.now() - startTime,
      accessTokenValid,
      adAccountValid,
      results,
      summary: {
        totalCampaigns,
        totalAdSets,
        totalSpend,
        campaignsWithData,
        campaignsWithoutData,
        errors,
        warnings
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      report
    })

  } catch (error: any) {
    console.error('Test complete error:', error)
    
    // Return partial report even on error
    const report: TestReport = {
      timestamp: new Date().toISOString(),
      totalTime: Date.now() - startTime,
      accessTokenValid,
      adAccountValid,
      results,
      summary: {
        totalCampaigns,
        totalAdSets,
        totalSpend,
        campaignsWithData,
        campaignsWithoutData,
        errors: [...errors, error.message],
        warnings
      }
    }
    
    return NextResponse.json({
      success: false,
      error: error.message,
      report
    })
  }
}

export async function GET() {
  return NextResponse.json({
    error: 'Method not allowed. Use POST with accessToken and adAccountId in the body.',
    example: {
      accessToken: 'your-meta-access-token',
      adAccountId: 'act_123456789',
      datePreset: 'last_30d' // optional, defaults to last_30d
    }
  }, { status: 405 })
}