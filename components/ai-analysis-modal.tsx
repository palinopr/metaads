"use client"
import { useState, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Sparkles, Loader2, Target, DollarSign, Users, Zap, AlertTriangle } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { formatCurrency } from "@/lib/utils" // Assuming you have these

interface CampaignMain {
  id: string
  name: string
  created_time: string
  processedInsights: {
    spend: number
    revenue: number
    roas: number
    conversions: number
    ctr: number
    cpc: number
    impressions: number
  }
}

interface HistoricalDataPoint {
  date: string
  spend: number
  revenue: number
  roas: number
  conversions: number
}

interface AIAnalysisModalProps {
  campaign: CampaignMain // Use the main campaign type
  historicalData?: HistoricalDataPoint[] // Use the specific type for predictions
  allCampaigns?: CampaignMain[] // Array of main campaign type
}

interface AIResponseContext {
  eventType?: string
  city?: string
  stage?: string
  timeSlot?: string
}

interface AIResponseBenchmarks {
  avgROAS?: number
  avgSpend?: number
  avgRevenue?: number
}

interface AIAnalysisData {
  fullAnalysis: string
  context?: AIResponseContext
  benchmarks?: AIResponseBenchmarks
  similarCampaignsCount?: number
  generatedAt: string
  error?: string
}

export function AIAnalysisModal({ campaign, historicalData, allCampaigns }: AIAnalysisModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [analysis, setAnalysis] = useState<AIAnalysisData | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const handleAnalyze = useCallback(async () => {
    if (!campaign) return
    setIsLoading(true)
    setAnalysis(null) // Clear previous analysis

    try {
      // Prepare data for the API
      const campaignDataForAPI = {
        name: campaign.name,
        created_time: campaign.created_time,
        ...campaign.processedInsights, // Spread processed insights
        daysSinceStart: Math.floor((Date.now() - new Date(campaign.created_time).getTime()) / (1000 * 60 * 60 * 24)),
      }

      const similarCampaignsForAPI = allCampaigns
        ?.filter((c) => c.id !== campaign.id) // Exclude current campaign
        .map((c) => ({
          name: c.name,
          ...c.processedInsights, // Spread processed insights for similar campaigns
        }))

      const response = await fetch("/api/ai-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign: campaignDataForAPI,
          historicalData: historicalData, // This should be HistoricalDataPointForPrediction[]
          similarCampaigns: similarCampaignsForAPI,
        }),
      })

      const data: AIAnalysisData = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "AI Analysis request failed")
      }
      setAnalysis(data)
    } catch (error: any) {
      console.error("Failed to get AI analysis:", error)
      setAnalysis({
        fullAnalysis: `Failed to generate AI analysis. ${error.message || "Please try again."}`,
        error: error.message || "Unknown error",
        generatedAt: new Date().toISOString(),
      })
    } finally {
      setIsLoading(false)
    }
  }, [campaign, historicalData, allCampaigns])

  const getContextIcon = (eventType?: string) => {
    switch (eventType) {
      case "Reggaeton":
        return "🎵"
      case "RnB":
        return "🎤"
      case "Comedy":
        return "😄"
      case "Sports":
        return "⚽"
      default:
        return "🎉"
    }
  }

  const onOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open && !analysis && !isLoading) {
      // Fetch analysis only if dialog opens and no analysis yet
      handleAnalyze()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 hover:from-purple-700 hover:to-blue-700 text-xs px-3 py-1.5 h-auto"
        >
          <Sparkles className="w-3.5 h-3.5 mr-1.5" />
          AI Deep Analysis
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl md:max-w-4xl lg:max-w-5xl max-h-[90vh] flex flex-col bg-gray-900 text-white border-gray-700 shadow-2xl rounded-lg">
        <DialogHeader className="p-6 border-b border-gray-700">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-gray-100">
            <Sparkles className="w-7 h-7 text-purple-400" />
            AI-Powered Campaign Analysis: <span className="text-purple-300 truncate max-w-md">{campaign.name}</span>
          </DialogTitle>
          <DialogDescription className="text-gray-400">Intelligent insights powered by Claude AI.</DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Loader2 className="w-10 h-10 animate-spin text-purple-400 mb-6" />
              <p className="text-lg text-gray-300">Claude is analyzing campaign performance...</p>
              <p className="text-sm text-gray-500 mt-2">This may take a few moments.</p>
            </div>
          ) : analysis ? (
            <>
              {/* Campaign Context & Benchmarks Side-by-Side */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                {analysis.context && (
                  <div className="bg-gray-800/70 rounded-lg p-4 border border-gray-700/80 shadow-md">
                    <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-200 text-base">
                      {getContextIcon(analysis.context.eventType)}
                      Campaign Context
                    </h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <div>
                        <span className="text-gray-400">Type:</span>{" "}
                        <p className="font-medium text-gray-100">{analysis.context.eventType || "N/A"}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Location:</span>{" "}
                        <p className="font-medium text-gray-100">{analysis.context.city || "N/A"}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Stage:</span>{" "}
                        <p className="font-medium text-gray-100">{analysis.context.stage || "Active"}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Time Slot:</span>{" "}
                        <p className="font-medium text-gray-100">{analysis.context.timeSlot || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                )}

                {analysis.benchmarks && (analysis.similarCampaignsCount || 0) > 0 && (
                  <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 rounded-lg p-4 border border-blue-700/60 shadow-md">
                    <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-200 text-base">
                      <Target className="w-5 h-5 text-blue-400" />
                      Performance vs. Benchmarks ({analysis.similarCampaignsCount} similar)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center justify-between p-2 bg-gray-700/30 rounded">
                        <span className="text-gray-400">ROAS:</span>
                        <span
                          className={`font-bold ${campaign.processedInsights.roas > (analysis.benchmarks.avgROAS || 0) ? "text-green-400" : "text-red-400"}`}
                        >
                          {campaign.processedInsights.roas.toFixed(2)}x
                        </span>
                        <span className="text-xs text-gray-500">
                          (Avg: {(analysis.benchmarks.avgROAS || 0).toFixed(2)}x)
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-gray-700/30 rounded">
                        <span className="text-gray-400">Revenue:</span>
                        <span
                          className={`font-bold ${campaign.processedInsights.revenue > (analysis.benchmarks.avgRevenue || 0) ? "text-green-400" : "text-red-400"}`}
                        >
                          {formatCurrency(campaign.processedInsights.revenue)}
                        </span>
                        <span className="text-xs text-gray-500">
                          (Avg: {formatCurrency(analysis.benchmarks.avgRevenue || 0)})
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {analysis.error && (
                <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-4 text-red-300">
                  <div className="flex items-center gap-2 font-semibold mb-2">
                    <AlertTriangle className="w-5 h-5" /> AI Analysis Error
                  </div>
                  <p className="text-sm">{analysis.error}</p>
                  <p className="text-xs mt-2">Displaying fallback analysis if available.</p>
                </div>
              )}

              {/* AI Analysis Markdown */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700/80 shadow-lg">
                <div className="prose prose-sm sm:prose-base prose-invert max-w-none text-gray-300 leading-relaxed">
                  <ReactMarkdown
                    components={{
                      h1: ({ node, ...props }) => (
                        <h1
                          className="text-2xl font-bold mt-6 mb-4 text-purple-300 border-b border-purple-700/50 pb-2"
                          {...props}
                        />
                      ),
                      h2: ({ node, ...props }) => (
                        <h2
                          className="text-xl font-semibold mt-5 mb-3 text-blue-300 flex items-center gap-2"
                          {...props}
                        />
                      ),
                      h3: ({ node, ...props }) => (
                        <h3 className="text-lg font-medium mt-4 mb-2 text-gray-100" {...props} />
                      ),
                      p: ({ node, ...props }) => <p className="mb-3" {...props} />,
                      ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-4 space-y-1.5" {...props} />,
                      li: ({ node, ...props }) => <li className="text-gray-300" {...props} />,
                      strong: ({ node, ...props }) => <strong className="font-semibold text-gray-100" {...props} />,
                      a: ({ node, ...props }) => (
                        <a className="text-purple-400 hover:text-purple-300 underline" {...props} />
                      ),
                      code: ({ node, inline, ...props }) =>
                        inline ? (
                          <code className="bg-gray-700 text-purple-300 px-1 py-0.5 rounded text-sm" {...props} />
                        ) : (
                          <pre className="bg-gray-700 p-3 rounded overflow-x-auto text-sm" {...props} />
                        ),
                    }}
                  >
                    {analysis.fullAnalysis}
                  </ReactMarkdown>
                </div>
              </div>

              {/* Quick Actions (Illustrative) */}
              <div className="bg-gray-800/70 rounded-lg p-4 border border-gray-700/80 shadow-md">
                <h3 className="font-semibold mb-3 text-gray-200 text-base">Suggested Quick Actions</h3>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-green-400 border-green-600 hover:bg-green-900/30 hover:border-green-500 text-xs"
                  >
                    <DollarSign className="w-3.5 h-3.5 mr-1.5" />
                    Adjust Budget
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-blue-400 border-blue-600 hover:bg-blue-900/30 hover:border-blue-500 text-xs"
                  >
                    <Users className="w-3.5 h-3.5 mr-1.5" />
                    Refine Audience
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-purple-400 border-purple-600 hover:bg-purple-900/30 hover:border-purple-500 text-xs"
                  >
                    <Zap className="w-3.5 h-3.5 mr-1.5" />
                    Update Creatives
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  Note: These are illustrative actions. Implement changes based on the full analysis.
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <p className="text-gray-500">Click the button again or reopen to generate AI insights.</p>
            </div>
          )}
        </div>
        {analysis && (
          <div className="p-4 border-t border-gray-700 text-center">
            <p className="text-xs text-gray-500">
              AI analysis generated at {new Date(analysis.generatedAt).toLocaleString()}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
