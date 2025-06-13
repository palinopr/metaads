'use client'

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileText, Download, Loader2, Sparkles, BarChart3, TrendingUp, AlertCircle } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Campaign {
  id: string
  name: string
  status: string
  spend: number
  revenue: number
  roas: number
  conversions: number
  impressions: number
  clicks: number
  ctr: number
  cpc: number
  cpa: number
}

interface AIPDFExportProps {
  campaigns: Campaign[]
  accessToken: string
  adAccountId: string
  datePreset: string
  overviewData: any
}

interface ExportOptions {
  includeCharts: boolean
  includeDetailedAnalysis: boolean
  includeRecommendations: boolean
  includeCompetitorInsights: boolean
  analysisDepth: 'basic' | 'detailed' | 'comprehensive'
  selectedCampaigns: string[]
}

export function AIPDFExport({ 
  campaigns, 
  accessToken, 
  adAccountId, 
  datePreset,
  overviewData 
}: AIPDFExportProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeCharts: true,
    includeDetailedAnalysis: true,
    includeRecommendations: true,
    includeCompetitorInsights: false,
    analysisDepth: 'detailed',
    selectedCampaigns: campaigns.map(c => c.id)
  })

  const handleCampaignToggle = (campaignId: string) => {
    setExportOptions(prev => ({
      ...prev,
      selectedCampaigns: prev.selectedCampaigns.includes(campaignId)
        ? prev.selectedCampaigns.filter(id => id !== campaignId)
        : [...prev.selectedCampaigns, campaignId]
    }))
  }

  const selectAllCampaigns = () => {
    setExportOptions(prev => ({
      ...prev,
      selectedCampaigns: campaigns.map(c => c.id)
    }))
  }

  const clearSelection = () => {
    setExportOptions(prev => ({
      ...prev,
      selectedCampaigns: []
    }))
  }

  const generatePDFReport = async () => {
    if (exportOptions.selectedCampaigns.length === 0) {
      setError('Please select at least one campaign')
      return
    }

    // Check if Anthropic API key is configured
    const anthropicApiKey = localStorage.getItem('anthropic_api_key')
    if (!anthropicApiKey) {
      setError('Anthropic API key not configured. Please go to AI Settings to add your API key.')
      return
    }

    setIsGenerating(true)
    setProgress(0)
    setError(null)

    try {
      // Step 1: Gather data
      setCurrentStep('Collecting campaign data...')
      setProgress(10)

      const selectedCampaignData = campaigns.filter(c => 
        exportOptions.selectedCampaigns.includes(c.id)
      )

      // Step 2: Get detailed insights for selected campaigns
      setCurrentStep('Fetching detailed performance data...')
      setProgress(25)

      const detailedData = await Promise.all(
        selectedCampaignData.map(async (campaign) => {
          try {
            // Get historical data
            const historicalResponse = await fetch('/api/campaign-historical', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                campaignId: campaign.id,
                datePreset,
                accessToken
              })
            })

            const historicalData = historicalResponse.ok 
              ? await historicalResponse.json() 
              : { historicalData: [] }

            // Get adsets data if detailed analysis is requested
            let adSetsData = []
            if (exportOptions.includeDetailedAnalysis) {
              const adSetsResponse = await fetch('/api/meta/campaign-adsets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  campaignId: campaign.id,
                  accessToken,
                  datePreset
                })
              })

              if (adSetsResponse.ok) {
                const adSetsResult = await adSetsResponse.json()
                adSetsData = adSetsResult.adSets || []
              }
            }

            return {
              ...campaign,
              historicalData: historicalData.historicalData || [],
              adSets: adSetsData
            }
          } catch (err) {
            console.error(`Error fetching data for campaign ${campaign.id}:`, err)
            return {
              ...campaign,
              historicalData: [],
              adSets: []
            }
          }
        })
      )

      // Step 3: Generate AI analysis
      setCurrentStep('Generating AI analysis with Claude Opus...')
      setProgress(50)

      const analysisResponse = await fetch('/api/ai/generate-pdf-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaigns: detailedData,
          overviewData,
          datePreset,
          exportOptions,
          accountId: adAccountId,
          anthropicApiKey
        })
      })

      if (!analysisResponse.ok) {
        const errorData = await analysisResponse.json()
        throw new Error(errorData.error || 'Failed to generate AI analysis')
      }

      const analysisResult = await analysisResponse.json()

      // Step 4: Generate charts and visualizations
      setCurrentStep('Creating charts and visualizations...')
      setProgress(75)

      const chartsData = exportOptions.includeCharts ? {
        performanceChart: detailedData.map(campaign => ({
          name: campaign.name.substring(0, 20) + '...',
          spend: campaign.spend,
          revenue: campaign.revenue,
          roas: campaign.roas,
          conversions: campaign.conversions
        })),
        trendChart: detailedData[0]?.historicalData?.map((day: any) => ({
          date: day.date,
          spend: day.spend,
          revenue: day.revenue,
          roas: day.roas
        })) || []
      } : null

      // Step 5: Generate PDF
      setCurrentStep('Generating PDF document...')
      setProgress(90)

      const pdfResponse = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis: analysisResult.analysis,
          campaigns: detailedData,
          overviewData,
          chartsData,
          exportOptions,
          datePreset
        })
      })

      if (!pdfResponse.ok) {
        const errorData = await pdfResponse.json()
        throw new Error(errorData.error || 'Failed to generate PDF')
      }

      // Step 6: Open HTML report in new window for printing
      setCurrentStep('Opening report for download...')
      setProgress(100)

      const pdfResult = await pdfResponse.json()
      
      if (pdfResult.htmlContent) {
        // Open HTML content in new window for printing
        const printWindow = window.open('', '_blank')
        if (printWindow) {
          printWindow.document.write(pdfResult.htmlContent)
          printWindow.document.close()
          
          // Wait for content to load, then trigger print dialog
          printWindow.onload = () => {
            setTimeout(() => {
              printWindow.print()
            }, 500)
          }
        }
      }

      setCurrentStep('Report opened! Use Ctrl+P (Cmd+P on Mac) to save as PDF')
      setTimeout(() => {
        setIsGenerating(false)
        setIsOpen(false)
      }, 3000)

    } catch (err: any) {
      console.error('PDF generation error:', err)
      setError(err.message || 'Failed to generate PDF report')
      setIsGenerating(false)
    }
  }

  const selectedCampaigns = campaigns.filter(c => exportOptions.selectedCampaigns.includes(c.id))
  const totalSpend = selectedCampaigns.reduce((sum, c) => sum + c.spend, 0)
  const totalRevenue = selectedCampaigns.reduce((sum, c) => sum + c.revenue, 0)
  const avgROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          AI PDF Report
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            AI-Powered PDF Campaign Analysis
          </DialogTitle>
        </DialogHeader>

        {isGenerating ? (
          <div className="space-y-6 py-8">
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-500" />
              <div>
                <h3 className="text-lg font-semibold">Generating Your AI Analysis Report</h3>
                <p className="text-gray-400 text-sm mt-1">{currentStep}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>

            <div className="bg-gray-800/50 rounded-lg p-4">
              <h4 className="font-medium mb-2">What's being generated:</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Comprehensive campaign performance analysis</li>
                <li>• AI-powered insights and recommendations</li>
                <li>• Performance visualizations and charts</li>
                <li>• Actionable optimization strategies</li>
                <li>• Professional PDF report with executive summary</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Campaign Selection */}
            <Card className="bg-gray-800/50 border-gray-600">
              <CardHeader>
                <CardTitle className="text-base">Select Campaigns to Analyze</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button onClick={selectAllCampaigns} variant="outline" size="sm">
                    Select All
                  </Button>
                  <Button onClick={clearSelection} variant="outline" size="sm">
                    Clear
                  </Button>
                </div>

                <div className="max-h-40 overflow-y-auto space-y-2 border border-gray-600 rounded p-3">
                  {campaigns.map((campaign) => (
                    <div key={campaign.id} className="flex items-center space-x-2">
                      <Checkbox
                        checked={exportOptions.selectedCampaigns.includes(campaign.id)}
                        onCheckedChange={() => handleCampaignToggle(campaign.id)}
                      />
                      <div className="flex-1 grid grid-cols-4 gap-2 text-xs">
                        <div className="col-span-2 font-medium">{campaign.name}</div>
                        <div>Spend: ${campaign.spend.toFixed(2)}</div>
                        <div>ROAS: {campaign.roas.toFixed(2)}x</div>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedCampaigns.length > 0 && (
                  <div className="bg-gray-700/50 rounded p-3">
                    <h4 className="font-medium mb-2">Selected Campaigns Summary</h4>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Campaigns:</span>
                        <p className="font-bold">{selectedCampaigns.length}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Total Spend:</span>
                        <p className="font-bold text-blue-400">${totalSpend.toFixed(2)}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Total Revenue:</span>
                        <p className="font-bold text-green-400">${totalRevenue.toFixed(2)}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Avg ROAS:</span>
                        <p className="font-bold text-purple-400">{avgROAS.toFixed(2)}x</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Export Options */}
            <Card className="bg-gray-800/50 border-gray-600">
              <CardHeader>
                <CardTitle className="text-base">Analysis Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Analysis Depth</Label>
                  <Select 
                    value={exportOptions.analysisDepth} 
                    onValueChange={(value: any) => setExportOptions(prev => ({ ...prev, analysisDepth: value }))}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic Analysis</SelectItem>
                      <SelectItem value="detailed">Detailed Analysis (Recommended)</SelectItem>
                      <SelectItem value="comprehensive">Comprehensive Analysis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={exportOptions.includeCharts}
                      onCheckedChange={(checked) => 
                        setExportOptions(prev => ({ ...prev, includeCharts: !!checked }))
                      }
                    />
                    <Label className="text-sm">
                      <BarChart3 className="w-4 h-4 inline mr-1" />
                      Include Charts & Visualizations
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={exportOptions.includeDetailedAnalysis}
                      onCheckedChange={(checked) => 
                        setExportOptions(prev => ({ ...prev, includeDetailedAnalysis: !!checked }))
                      }
                    />
                    <Label className="text-sm">
                      <TrendingUp className="w-4 h-4 inline mr-1" />
                      Detailed Ad Set Analysis
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={exportOptions.includeRecommendations}
                      onCheckedChange={(checked) => 
                        setExportOptions(prev => ({ ...prev, includeRecommendations: !!checked }))
                      }
                    />
                    <Label className="text-sm">
                      <Sparkles className="w-4 h-4 inline mr-1" />
                      AI Recommendations
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={exportOptions.includeCompetitorInsights}
                      onCheckedChange={(checked) => 
                        setExportOptions(prev => ({ ...prev, includeCompetitorInsights: !!checked }))
                      }
                    />
                    <Label className="text-sm">
                      <FileText className="w-4 h-4 inline mr-1" />
                      Industry Benchmarks
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Generate Button */}
            <div className="flex justify-between items-center pt-4">
              <div className="text-sm text-gray-400">
                Report will be generated using Claude Opus AI
              </div>
              <Button 
                onClick={generatePDFReport}
                disabled={selectedCampaigns.length === 0}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Generate AI Report
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}