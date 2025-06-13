import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const META_API_BASE = 'https://graph.facebook.com/v19.0'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const accessToken = cookieStore.get('fb_access_token')?.value
    const adAccountId = cookieStore.get('fb_selected_account')?.value
    
    if (!accessToken || !adAccountId) {
      return NextResponse.json({
        error: 'Missing credentials',
        success: false
      }, { status: 401 })
    }
    
    console.log('Debug lifetime spend for account:', adAccountId)
    
    // Method 1: Get account level spend
    const accountUrl = `${META_API_BASE}/${adAccountId}`
    const accountParams = new URLSearchParams({
      access_token: accessToken,
      fields: 'id,name,currency,amount_spent,spend_cap,balance'
    })
    
    const accountResponse = await fetch(`${accountUrl}?${accountParams}`)
    const accountData = await accountResponse.json()
    
    // Method 2: Get campaigns with lifetime insights
    const campaignsUrl = `${META_API_BASE}/${adAccountId}/campaigns`
    const campaignsParams = new URLSearchParams({
      access_token: accessToken,
      fields: 'id,name,lifetime_budget,insights{spend,impressions,clicks}',
      limit: '100'
    })
    
    const campaignsResponse = await fetch(`${campaignsUrl}?${campaignsParams}`)
    const campaignsData = await campaignsResponse.json()
    
    // Method 3: Get insights aggregated at account level
    const insightsUrl = `${META_API_BASE}/${adAccountId}/insights`
    const insightsParams = new URLSearchParams({
      access_token: accessToken,
      fields: 'spend,impressions,clicks,actions,action_values'
    })
    
    const insightsResponse = await fetch(`${insightsUrl}?${insightsParams}`)
    const insightsData = await insightsResponse.json()
    
    // Calculate total from campaigns
    let campaignTotalSpend = 0
    let campaignCount = 0
    
    if (campaignsData.data) {
      campaignsData.data.forEach((campaign: any) => {
        if (campaign.insights?.data?.[0]?.spend) {
          const spend = parseFloat(campaign.insights.data[0].spend)
          campaignTotalSpend += spend
          campaignCount++
        }
      })
    }
    
    // Parse account level spend
    const accountSpend = accountData.amount_spent ? parseFloat(accountData.amount_spent) / 100 : 0 // amount_spent is in cents
    
    // Parse aggregated insights spend
    const insightsSpend = insightsData.data?.[0]?.spend ? parseFloat(insightsData.data[0].spend) : 0
    
    return NextResponse.json({
      debug: {
        account: {
          id: accountData.id,
          name: accountData.name,
          currency: accountData.currency,
          amount_spent_cents: accountData.amount_spent,
          amount_spent_dollars: accountSpend,
          spend_cap: accountData.spend_cap,
          balance: accountData.balance,
          raw: accountData
        },
        campaignsSummary: {
          totalCampaigns: campaignsData.data?.length || 0,
          campaignsWithSpend: campaignCount,
          calculatedTotalSpend: campaignTotalSpend,
          firstFewCampaigns: campaignsData.data?.slice(0, 3).map((c: any) => ({
            name: c.name,
            spend: c.insights?.data?.[0]?.spend || 'No insights'
          }))
        },
        accountInsights: {
          hasData: !!insightsData.data?.[0],
          spend: insightsSpend,
          raw: insightsData.data?.[0]
        },
        comparison: {
          accountLevelSpend: accountSpend,
          campaignsSumSpend: campaignTotalSpend,
          insightsSpend: insightsSpend,
          note: "Dashboard should show campaign sum ($23,963.01), not account level ($1.5M)",
          metaWebInterfaceShows: 23963.01,
          discrepancy: {
            accountVsCampaigns: accountSpend - campaignTotalSpend,
            explanation: "Account includes historical/deleted campaigns from all time"
          }
        }
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('Debug lifetime spend error:', error)
    return NextResponse.json({
      error: 'Debug failed',
      message: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}