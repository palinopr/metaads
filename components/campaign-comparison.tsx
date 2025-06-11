"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart, Bar, LineChart, Line, RadarChart, Radar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Legend, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts'
import { ArrowUp, ArrowDown, Minus, TrendingUp } from 'lucide-react'
import { formatCurrency, formatPercentage } from '@/lib/utils'

interface CampaignComparisonProps {
  campaigns: any[]
}

export function CampaignComparison({ campaigns }: CampaignComparisonProps) {
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([])
  const [comparisonMetric, setComparisonMetric] = useState<'all' | 'spend' | 'roas' | 'conversions'>('all')

  const toggleCampaign = (campaignId: string) => {
    setSelectedCampaigns(prev => 
      prev.includes(campaignId) 
        ? prev.filter(id => id !== campaignId)
        : [...prev, campaignId].slice(0, 4) // Max 4 campaigns
    )
  }

  const selectedCampaignData = campaigns.filter(c => selectedCampaigns.includes(c.id))

  // Prepare comparison data
  const comparisonData = selectedCampaignData.map(campaign => ({
    name: campaign.name.substring(0, 20) + (campaign.name.length > 20 ? '...' : ''),
    spend: campaign.insights?.spend || 0,
    revenue: campaign.insights?.revenue || 0,
    roas: campaign.lifetimeROAS || 0,
    conversions: campaign.insights?.conversions || 0,
    ctr: campaign.insights?.ctr || 0,
    cpc: campaign.insights?.cpc || 0,
    cpa: campaign.insights?.cpa || 0,
    impressions: campaign.insights?.impressions || 0
  }))

  // Prepare radar chart data
  const radarData = selectedCampaignData.length > 0 ? [
    {
      metric: 'ROAS',
      ...selectedCampaignData.reduce((acc, campaign, idx) => ({
        ...acc,
        [campaign.name]: Math.min(campaign.lifetimeROAS * 25, 100) // Scale to 0-100
      }), {})
    },
    {
      metric: 'CTR',
      ...selectedCampaignData.reduce((acc, campaign, idx) => ({
        ...acc,
        [campaign.name]: Math.min((campaign.insights?.ctr || 0) * 40, 100) // Scale to 0-100
      }), {})
    },
    {
      metric: 'Conversions',
      ...selectedCampaignData.reduce((acc, campaign, idx) => ({
        ...acc,
        [campaign.name]: Math.min((campaign.insights?.conversions || 0) / 10, 100) // Scale to 0-100
      }), {})
    },
    {
      metric: 'Efficiency',
      ...selectedCampaignData.reduce((acc, campaign, idx) => ({
        ...acc,
        [campaign.name]: campaign.insights?.cpa ? Math.min(100 / campaign.insights.cpa, 100) : 0
      }), {})
    },
    {
      metric: 'Scale',
      ...selectedCampaignData.reduce((acc, campaign, idx) => ({
        ...acc,
        [campaign.name]: Math.min((campaign.insights?.spend || 0) / 100, 100) // Scale to 0-100
      }), {})
    }
  ] : []

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']

  return (
    <div className="space-y-6">
      {/* Campaign Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Campaigns to Compare</CardTitle>
          <CardDescription>
            Choose up to 4 campaigns to compare side-by-side
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {campaigns.map(campaign => (
              <Badge
                key={campaign.id}
                variant={selectedCampaigns.includes(campaign.id) ? "default" : "outline"}
                className="cursor-pointer hover:opacity-80"
                onClick={() => toggleCampaign(campaign.id)}
              >
                {campaign.name}
                {selectedCampaigns.includes(campaign.id) && " ✓"}
              </Badge>
            ))}
          </div>
          
          {selectedCampaigns.length > 0 && (
            <div className="mt-4">
              <Select value={comparisonMetric} onValueChange={setComparisonMetric as any}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Metrics</SelectItem>
                  <SelectItem value="spend">Spend & Revenue</SelectItem>
                  <SelectItem value="roas">ROAS & Efficiency</SelectItem>
                  <SelectItem value="conversions">Conversions</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedCampaigns.length >= 2 && (
        <>
          {/* Performance Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip formatter={(value: any) => formatCurrency(value)} />
                    <Legend />
                    {(comparisonMetric === 'all' || comparisonMetric === 'spend') && (
                      <>
                        <Bar dataKey="spend" fill="#ef4444" name="Spend" />
                        <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
                      </>
                    )}
                    {(comparisonMetric === 'all' || comparisonMetric === 'conversions') && (
                      <Bar dataKey="conversions" fill="#3b82f6" name="Conversions" />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Radar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Multi-Metric Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    {selectedCampaignData.map((campaign, idx) => (
                      <Radar
                        key={campaign.id}
                        name={campaign.name}
                        dataKey={campaign.name}
                        stroke={colors[idx]}
                        fill={colors[idx]}
                        fillOpacity={0.3}
                      />
                    ))}
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Comparison Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Metric</th>
                      {selectedCampaignData.map(campaign => (
                        <th key={campaign.id} className="text-right p-2">
                          {campaign.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Total Spend</td>
                      {selectedCampaignData.map(campaign => (
                        <td key={campaign.id} className="text-right p-2">
                          {formatCurrency(campaign.insights?.spend || 0)}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Revenue</td>
                      {selectedCampaignData.map(campaign => (
                        <td key={campaign.id} className="text-right p-2">
                          {formatCurrency(campaign.insights?.revenue || 0)}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">ROAS</td>
                      {selectedCampaignData.map(campaign => {
                        const roas = campaign.lifetimeROAS || 0
                        const isWinner = Math.max(...selectedCampaignData.map(c => c.lifetimeROAS || 0)) === roas
                        return (
                          <td key={campaign.id} className="text-right p-2">
                            <span className={isWinner ? 'text-green-600 font-bold' : ''}>
                              {roas.toFixed(2)}x
                            </span>
                          </td>
                        )
                      })}
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Conversions</td>
                      {selectedCampaignData.map(campaign => (
                        <td key={campaign.id} className="text-right p-2">
                          {campaign.insights?.conversions || 0}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">CTR</td>
                      {selectedCampaignData.map(campaign => (
                        <td key={campaign.id} className="text-right p-2">
                          {(campaign.insights?.ctr || 0).toFixed(2)}%
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">CPA</td>
                      {selectedCampaignData.map(campaign => (
                        <td key={campaign.id} className="text-right p-2">
                          {formatCurrency(campaign.insights?.cpa || 0)}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Winner Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign Winner Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['roas', 'conversions', 'ctr', 'efficiency'].map(metric => {
                  let winner = null
                  let value = 0
                  
                  selectedCampaignData.forEach(campaign => {
                    let metricValue = 0
                    switch(metric) {
                      case 'roas':
                        metricValue = campaign.lifetimeROAS || 0
                        break
                      case 'conversions':
                        metricValue = campaign.insights?.conversions || 0
                        break
                      case 'ctr':
                        metricValue = campaign.insights?.ctr || 0
                        break
                      case 'efficiency':
                        metricValue = campaign.insights?.cpa ? 1 / campaign.insights.cpa : 0
                        break
                    }
                    
                    if (metricValue > value) {
                      value = metricValue
                      winner = campaign
                    }
                  })
                  
                  return winner ? (
                    <div key={metric} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium capitalize">{metric} Winner</p>
                        <p className="text-sm text-muted-foreground">{winner.name}</p>
                      </div>
                      <Badge variant="default">
                        {metric === 'roas' && `${value.toFixed(2)}x`}
                        {metric === 'conversions' && value}
                        {metric === 'ctr' && `${value.toFixed(2)}%`}
                        {metric === 'efficiency' && 'Most Efficient'}
                      </Badge>
                    </div>
                  ) : null
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}